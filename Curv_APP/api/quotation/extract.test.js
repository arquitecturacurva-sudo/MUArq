import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQuoteHandler, reserveQuoteBudget } from "./extract.js";
const request=(patch={})=>({method:"POST",headers:{authorization:"Bearer token"},body:{fileName:"Obra.pdf",pageCount:1,pdfBase64:Buffer.from("%PDF-1.7\ntest").toString("base64")},...patch});
const res=()=>({code:200,body:null,headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(v){this.body=v;return this;}});
describe("quotation extraction API",()=>{
 let deps;
 beforeEach(()=>{deps={getAdmin:vi.fn().mockResolvedValue({adminAuth:{verifyIdToken:vi.fn().mockResolvedValue({uid:"u1"})},adminDb:{}}),getApiKey:()=> "server-key",extract:vi.fn().mockResolvedValue({document:{partidas:[]}}),reserve:vi.fn().mockResolvedValue(undefined)};});
 it("rejects missing/revoked authentication and methods before provider use",async()=>{
   for(const [req,status] of [[request({headers:{}}),401],[request({method:"GET"}),405]]){
     const response=res();await createQuoteHandler(deps)(req,response);expect(response.code).toBe(status);
   }
   deps.getAdmin.mockResolvedValue({adminAuth:{verifyIdToken:async()=>{throw new Error("revoked");}}});
   const response=res();await createQuoteHandler(deps)(request(),response);expect(response.code).toBe(401);expect(deps.extract).not.toHaveBeenCalled();
 });
 it("reserves tenant quota before calling provider and exposes no-store",async()=>{
   const response=res();await createQuoteHandler(deps)(request(),response);
   expect(response.code).toBe(200);expect(deps.reserve).toHaveBeenCalledWith({},"u1",1);
   expect(deps.reserve.mock.invocationCallOrder[0]).toBeLessThan(deps.extract.mock.invocationCallOrder[0]);
   expect(response.headers["Cache-Control"]).toBe("no-store");
 });
 it("reports absent configuration without spending quota",async()=>{
   deps.getApiKey=()=>"";const response=res();await createQuoteHandler(deps)(request(),response);
   expect(response.code).toBe(503);expect(deps.reserve).not.toHaveBeenCalled();expect(deps.extract).not.toHaveBeenCalled();
 });
});
function quotaDb({role="editor",status="active",uid="u1",requests=0,pages=0,studyStatus="active"}={}) {
 const snapshots=new Map([
  ["users/u1",{activeClientId:"tenant-a"}],["clients/tenant-a",{status:studyStatus}],
  ["clients/tenant-a/members/u1",{uid,role,status}],
 ]);
 const ref=path=>({path,collection:name=>({doc:id=>ref(path+"/"+name+"/"+id)}),get:async()=>({data:()=>snapshots.get(path)})});
 const tx={get:async r=>({exists:true,data:()=>r.path.includes("quotationImportUsage")?{requests,pages}:snapshots.get(r.path)}),set:vi.fn()};
 return {db:{doc:ref,runTransaction:async run=>run(tx)},tx};
}
describe("tenant access and spending quota",()=>{
 it("allows active editors with an atomic reservation",async()=>{
  const {db,tx}=quotaDb();await reserveQuoteBudget(db,"u1",30);
  expect(tx.set).toHaveBeenCalledWith(expect.objectContaining({path:expect.stringContaining("clients/tenant-a/quotationImportUsage/")}),expect.objectContaining({requests:1,pages:30}));
 });
 it("rejects viewers, removed members, mismatched uid and inactive studies",async()=>{
  for(const config of [{role:"viewer"},{status:"removed"},{uid:"other"},{studyStatus:"suspended"}]){
   const {db,tx}=quotaDb(config);await expect(reserveQuoteBudget(db,"u1",1)).rejects.toMatchObject({status:403});expect(tx.set).not.toHaveBeenCalled();
  }
 });
 it("enforces request and page budgets before provider spend",async()=>{
  for(const config of [{requests:20},{pages:199}]){
   const {db,tx}=quotaDb(config);await expect(reserveQuoteBudget(db,"u1",2)).rejects.toMatchObject({status:429});expect(tx.set).not.toHaveBeenCalled();
  }
 });
});

