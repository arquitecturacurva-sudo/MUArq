import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../../functions/package.json', import.meta.url));
const admin = require('firebase-admin');
const { createInvitationBackend } = require('./lib/tenant/invitationService.js');
if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST || !process.env.GCLOUD_PROJECT?.startsWith('demo-')) throw Error('Only isolated demo emulators are allowed');
const project = process.env.GCLOUD_PROJECT;
const app = admin.initializeApp({ projectId: project });
const db = admin.firestore(); const auth = admin.auth(); const backend = createInvitationBackend(db);
const actor = uid => ({ uid, email: uid + '@example.test', verified: true, name: uid });
async function seed(editorsLimit = 3, viewersLimit = 2) {
  const tenantId = 't_' + randomUUID(); const owner = actor('o_' + randomUUID());
  const tenant = db.doc('clients/' + tenantId);
  await tenant.set({ id: tenantId, name: 'Estudio QA', ownerUid: owner.uid, status: 'active', limits: { editorsLimit, viewersLimit } });
  await tenant.collection('members').doc(owner.uid).set({ uid: owner.uid, email: owner.email, role: 'admin', createdAt: new Date().toISOString() });
  await tenant.collection('projects').doc('p1').set({ id: 'p1', clientId: tenantId, name: 'Casa QA' });
  await tenant.collection('projects').doc('p2').set({ id: 'p2', clientId: tenantId, name: 'Proyecto privado' });
  await tenant.collection('projects').doc('p1').collection('toolData').doc('calc').set({ data: { presupuesto: 100 } });
  return { tenantId, tenant, owner };
}
const input = (tenantId, email, role = 'editor', projectIds = []) => ({ tenantId, requestId: randomUUID(), email, role, projectIds });
const link = (tenantId, result) => ({ tenantId, invitationId: result.invitation.id, token: result.token });
async function rejects(action, code) { await assert.rejects(action, error => error.code === code); }
after(async () => { await app.delete(); });

test('create, list reservations, accept twice atomically and preserve other tenants', async () => {
  const { tenantId, owner, tenant } = await seed(); const invited = actor('new_' + randomUUID());
  await db.doc('users/' + invited.uid).set({ uid: invited.uid, clientIds: ['existing'], activeClientId: 'existing' });
  const request = input(tenantId, invited.email); const created = await backend.create(owner, request);
  assert.equal((await tenant.collection('members').doc(invited.uid).get()).exists, false);
  assert.equal((await backend.list(owner, { tenantId })).usage.editors, 2);
  assert.equal((await backend.create(owner, request)).token, null);
  const stored = (await tenant.collection('invitations').doc(created.invitation.id).get()).data();
  assert.equal(stored.token, undefined); assert.equal(stored.tokenHash.length, 64);
  assert.equal(JSON.stringify(await backend.list(owner, { tenantId })).includes(stored.tokenHash), false);
  const results = await Promise.all([backend.accept(invited, link(tenantId, created)), backend.accept(invited, link(tenantId, created))]);
  assert.equal(results[0].tenantId, tenantId); assert.equal(results[1].role, 'editor');
  assert.equal((await backend.list(owner, { tenantId })).usage.editors, 2);
  assert.deepEqual((await db.doc('users/' + invited.uid).get()).data().clientIds, ['existing', tenantId]);
});
test('concurrent last-seat invitations serialize on the tenant', async () => {
  const { tenantId, owner } = await seed(2);
  const results = await Promise.allSettled([backend.create(owner, input(tenantId, 'a@example.test')), backend.create(owner, input(tenantId, 'b@example.test'))]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(results.find(result => result.status === 'rejected').reason.code, 'resource-exhausted');
});
test('roles, foreign tenants and invalid viewer project scope are rejected', async () => {
  const { tenantId, owner, tenant } = await seed();
  for (const role of ['editor', 'viewer']) {
    const member = actor('m_' + randomUUID()); await tenant.collection('members').doc(member.uid).set({ uid: member.uid, role });
    await rejects(() => backend.create(member, input(tenantId, 'new@example.test')), 'permission-denied');
  }
  await rejects(() => backend.create(actor('outside'), input(tenantId, 'new@example.test')), 'permission-denied');
  await rejects(() => backend.create(owner, input(tenantId, 'new@example.test', 'viewer', [])), 'invalid-argument');
  await rejects(() => backend.create(owner, input(tenantId, 'new@example.test', 'viewer', ['foreign'])), 'invalid-argument');
});
test('wrong email, unverified, bad token, expiry, cancelled and rotated links cannot activate membership', async () => {
  const { tenantId, owner, tenant } = await seed(); const invited = actor('v_' + randomUUID());
  const created = await backend.create(owner, input(tenantId, invited.email, 'viewer', ['p1']));
  await rejects(() => backend.accept({ ...invited, verified: false }, link(tenantId, created)), 'failed-precondition');
  await rejects(() => backend.accept(actor('wrong'), link(tenantId, created)), 'permission-denied');
  await rejects(() => backend.accept(invited, { ...link(tenantId, created), token: 'x'.repeat(43) }), 'permission-denied');
  const renewed = await backend.change(owner, { tenantId, invitationId: created.invitation.id }, true);
  await rejects(() => backend.accept(invited, link(tenantId, created)), 'permission-denied');
  const current = { ...link(tenantId, created), token: renewed.token };
  await tenant.collection('invitations').doc(created.invitation.id).update({ expiresAt: admin.firestore.Timestamp.fromMillis(1) });
  await rejects(() => backend.accept(invited, current), 'failed-precondition');
  assert.equal((await backend.list(owner, { tenantId })).usage.viewers, 0);
  await backend.change(owner, { tenantId, invitationId: created.invitation.id }, false);
  await rejects(() => backend.accept(invited, current), 'failed-precondition');
  assert.equal((await tenant.collection('members').doc(invited.uid).get()).exists, false);
});
test('renew expiry reserves a seat and cancel is idempotent', async () => {
  const { tenantId, owner, tenant } = await seed();
  const created = await backend.create(owner, input(tenantId, 'renew@example.test'));
  await tenant.collection('invitations').doc(created.invitation.id).update({ expiresAt: admin.firestore.Timestamp.fromMillis(1) });
  await backend.change(owner, { tenantId, invitationId: created.invitation.id }, true);
  assert.equal((await backend.list(owner, { tenantId })).usage.editors, 2);
  await backend.change(owner, { tenantId, invitationId: created.invitation.id }, false);
  await backend.change(owner, { tenantId, invitationId: created.invitation.id }, false);
  assert.equal((await backend.list(owner, { tenantId })).usage.editors, 1);
});
test('demoted inviter, deleted project and existing membership are revalidated at acceptance', async () => {
  const { tenantId, owner, tenant } = await seed(); const invited = actor('a_' + randomUUID());
  const created = await backend.create(owner, input(tenantId, invited.email, 'viewer', ['p1']));
  await tenant.collection('members').doc(owner.uid).update({ role: 'editor' });
  await rejects(() => backend.accept(invited, link(tenantId, created)), 'permission-denied');
  await tenant.collection('members').doc(owner.uid).update({ role: 'admin' });
  await tenant.collection('projects').doc('p1').delete();
  await rejects(() => backend.accept(invited, link(tenantId, created)), 'invalid-argument');
  await tenant.collection('members').doc(invited.uid).set({ uid: invited.uid, role: 'admin' });
  await rejects(() => backend.accept(invited, link(tenantId, created)), 'already-exists');
  assert.equal((await tenant.collection('members').doc(invited.uid).get()).data().role, 'admin');
});
test('session summary excludes billing and inactive memberships; selection validates tenant', async () => {
  const { tenantId, owner, tenant } = await seed();
  await tenant.update({ billing: { secret: 'not-a-summary-field' } });
  const summary = await backend.session(owner);
  assert.equal(summary.activeTenantId, tenantId); assert.equal(JSON.stringify(summary).includes('billing'), false);
  await backend.select(owner, { tenantId });
  await rejects(() => backend.select(actor('other'), { tenantId }), 'permission-denied');
  await tenant.collection('members').doc(owner.uid).update({ status: 'revoked' });
  assert.equal((await backend.session(owner)).tenants.length, 0);
});
test('attempt rate persists even when a token is rejected', async () => {
  const { tenantId, owner } = await seed(); const invited = actor('rate_' + randomUUID());
  const created = await backend.create(owner, input(tenantId, invited.email));
  await db.doc('invitationRateLimits/' + invited.uid + '_accept').set({ start: Date.now(), count: 59 });
  await rejects(() => backend.accept(invited, { ...link(tenantId, created), token: 'x'.repeat(43) }), 'permission-denied');
  await rejects(() => backend.accept(invited, link(tenantId, created)), 'resource-exhausted');
});

async function authRequest(method, data) {
  const result = await fetch('http://' + process.env.FIREBASE_AUTH_EMULATOR_HOST + '/identitytoolkit.googleapis.com/v1/accounts:' + method + '?key=fake', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  const body = await result.json(); assert.equal(result.status, 200, JSON.stringify(body)); return body;
}
async function call(name, data, token) {
  const response = await fetch('http://127.0.0.1:5005/' + project + '/us-central1/' + name, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: JSON.stringify({ data }) });
  return { status: response.status, body: await response.json() };
}
test('real callable Auth flow: create, avoid duplicate bootstrap, verify email, accept and scope Viewer', async () => {
  const password = 'LocalTestOnly123!'; const { tenantId, owner, tenant } = await seed();
  await auth.createUser({ uid: owner.uid, email: owner.email, password, emailVerified: true });
  const ownerLogin = await authRequest('signInWithPassword', { email: owner.email, password, returnSecureToken: true });
  const email = 'http_' + randomUUID() + '@example.test';
  const created = await call('createTeamInvitation', input(tenantId, email, 'viewer', ['p1']), ownerLogin.idToken);
  assert.equal(created.status, 200, JSON.stringify(created.body));
  const newUser = await authRequest('signUp', { email, password, returnSecureToken: true });
  const bootstrap = await call('ensureTenant', {}, newUser.idToken);
  assert.equal(bootstrap.body.error.status, 'FAILED_PRECONDITION');
  assert.equal((await db.collection('clients').where('ownerUid', '==', newUser.localId).get()).size, 0);
  const invitation = link(tenantId, created.body.result);
  assert.equal((await call('acceptTeamInvitation', invitation, newUser.idToken)).body.error.status, 'FAILED_PRECONDITION');
  await auth.updateUser(newUser.localId, { emailVerified: true });
  const login = await authRequest('signInWithPassword', { email, password, returnSecureToken: true });
  const accepted = await call('acceptTeamInvitation', invitation, login.idToken);
  assert.equal(accepted.status, 200, JSON.stringify(accepted.body));
  const session = await call('getTeamSession', {}, login.idToken);
  assert.deepEqual(session.body.result.tenants[0].projectIds, ['p1']);
  assert.equal(session.body.result.tenants[0].role, 'viewer');
  const member = (await tenant.collection('members').doc(newUser.localId).get()).data();
  assert.equal(member.status, 'active'); assert.deepEqual(member.accessScope, { kind: 'projects', projectIds: ['p1'] });
  assert.equal((await call('createTeamInvitation', input(tenantId, 'not-allowed@example.test'), login.idToken)).body.error.status, 'PERMISSION_DENIED');
  assert.equal((await call('listTeamInvitations', { tenantId }, login.idToken)).body.error.status, 'PERMISSION_DENIED');
  assert.equal((await call('acceptTeamInvitation', invitation)).body.error.status, 'UNAUTHENTICATED');
});

test('seat counts include reservations and remain hidden from Viewers', async () => {
  const { tenantId, owner, tenant } = await seed();
  const invited = actor('seats_' + randomUUID());
  await backend.create(owner, input(tenantId, invited.email, 'viewer', ['p1']));
  assert.equal((await backend.seats(owner, { tenantId })).usage.viewers, 1);
  await tenant.collection('members').doc(invited.uid).set({ uid: invited.uid, role: 'viewer', status: 'active' });
  await rejects(() => backend.seats(invited, { tenantId }), 'permission-denied');
});
test('accept versus cancel is atomic and cannot leave a cancelled invitation with access', async () => {
  const { tenantId, owner, tenant } = await seed(); const invited = actor('race_' + randomUUID());
  const created = await backend.create(owner, input(tenantId, invited.email));
  await Promise.allSettled([backend.accept(invited, link(tenantId, created)), backend.change(owner, { tenantId, invitationId: created.invitation.id }, false)]);
  const status = (await tenant.collection('invitations').doc(created.invitation.id).get()).data().status;
  const member = await tenant.collection('members').doc(invited.uid).get();
  assert.equal(member.exists, status === 'accepted');
  assert.ok(['accepted', 'cancelled'].includes(status));
});

test('acceptance preview shows study and scope only to the verified invited account', async () => {
  const { tenantId, owner } = await seed(); const invited = actor('preview_' + randomUUID());
  const created = await backend.create(owner, input(tenantId, invited.email, 'viewer', ['p1']));
  const preview = await backend.preview(invited, link(tenantId, created));
  assert.equal(preview.role, 'viewer'); assert.deepEqual(preview.projectIds, ['p1']);
  assert.deepEqual(Object.keys(preview).sort(), ['expiresAt', 'projectIds', 'role', 'tenantName']);
  await rejects(() => backend.preview({ ...invited, verified: false }, link(tenantId, created)), 'failed-precondition');
  await rejects(() => backend.preview(actor('wrong'), link(tenantId, created)), 'permission-denied');
  await backend.change(owner, { tenantId, invitationId: created.invitation.id }, false);
  await rejects(() => backend.preview(invited, link(tenantId, created)), 'failed-precondition');
});
