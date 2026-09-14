import type { PrototypeTenantSeed } from "../../infrastructure/tenant/prototypeTenantRepository";
import type { MemberRole, MembershipStatus, TenantMembership } from "../../domain/tenant/teamAccess";
const member = (tenantId: string, uid: string, displayName: string, email: string, role: MemberRole,
  projectIds: string[] = [], status: MembershipStatus = "active"): TenantMembership =>
  ({ tenantId, uid, displayName, email, role, status, isOwner: uid === "mateo",
    accessScope: role === "viewer" ? { kind: "projects", projectIds } : { kind: "tenant" } });

export const prototypeSeed: PrototypeTenantSeed[] = [
  {
    tenant: { id: "norte", name: "Estudio Norte", ownerUid: "mateo" },
    limits: { editors: 8, viewers: 15 },
    projects: [
      { id: "casa-ladera", tenantId: "norte", name: "Casa Ladera" },
      { id: "cafe-nerea", tenantId: "norte", name: "Cafe Nerea" },
      { id: "oficinas-rio", tenantId: "norte", name: "Oficinas Rio" },
    ],
    members: [
      member("norte", "mateo", "Mateo Rojas", "mateo@estudionorte.demo", "admin"),
      member("norte", "ana", "Ana Ruiz", "ana@estudionorte.demo", "admin"),
      member("norte", "diego", "Diego Vega", "diego@estudionorte.demo", "editor"),
      member("norte", "elena", "Elena Torres", "elena@estudionorte.demo", "editor"),
      member("norte", "carlos", "Carlos Molina", "carlos@cliente.demo", "viewer", ["casa-ladera"]),
      member("norte", "valeria", "Valeria Soto", "valeria@consultora.demo", "viewer", ["cafe-nerea", "oficinas-rio"]),
      member("norte", "sofia", "", "sofia@estudionorte.demo", "editor", [], "invited"),
    ],
  },
  {
    tenant: { id: "sur", name: "Taller Sur", ownerUid: "mateo" },
    limits: { editors: 3, viewers: 5 },
    projects: [{ id: "patio-sur", tenantId: "sur", name: "Casa Patio" }],
    members: [
      member("sur", "mateo", "Mateo Rojas", "mateo@tallersur.demo", "admin"),
      member("sur", "lucia", "Lucia Salas", "lucia@tallersur.demo", "editor"),
      member("sur", "pedro", "Pedro Leon", "pedro@tallersur.demo", "editor"),
    ],
  },
];
