import { beforeEach, afterEach, expect, it, vi } from "vitest";
const mocks=vi.hoisted(()=>({verify:vi.fn(),member:vi.fn(),transaction:vi.fn(),fetch:vi.fn()}));
vi.mock("../_lib/firebase-admin.js",()=>({adminAuth:{verifyIdToken:mocks.verify},adminDb:{
  collection:()=>({doc:()=>({collection:()=>({doc:()=>({get:mocks.member})})})}),runTransaction:mocks.transaction,
}}));
import handler from "./parse.js";
const image="data:image/png;base64,iVBORw0KGgo=";
const req=(body={clientId:"studio",image})=>({method:"POST",headers:{authorization:"Bearer session"},body});
const res=()=>({setHeader:vi.fn(),status:vi.fn().mockReturnThis(),json:vi.fn().mockReturnThis()});
beforeEach(()=>{vi.resetAllMocks();vi.stubEnv("NVIDIA_API_KEY","test-secret");vi.stubGlobal("fetch",mocks.fetch);mocks.verify.mockResolvedValue({uid:"user"});mocks.member.mockResolvedValue({exists:true,data:()=>({role:"editor"})});mocks.transaction.mockResolvedValue(true);});
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
it("requires authentication before consuming quota or contacting NVIDIA",async()=>{const r=res();await handler({...req(),headers:{}},r);expect(r.status).toHaveBeenCalledWith(401);expect(mocks.fetch).not.toHaveBeenCalled();});
it("rejects invalid tokens",async()=>{mocks.verify.mockRejectedValue(Error());const r=res();await handler(req(),r);expect(r.status).toHaveBeenCalledWith(401);expect(mocks.fetch).not.toHaveBeenCalled();});
it("rejects JSON null and arrays without calling the provider",async()=>{for(const body of ["null","[]"]){const r=res();await handler(req(body),r);expect(r.status).toHaveBeenCalledWith(400);}expect(mocks.fetch).not.toHaveBeenCalled();});
it("rejects nonmembers and viewers",async()=>{for(const role of [null,"viewer"]){mocks.member.mockResolvedValue({exists:!!role,data:()=>({role})});const r=res();await handler(req(),r);expect(r.status).toHaveBeenCalledWith(403);}expect(mocks.fetch).not.toHaveBeenCalled();});
it("rejects arbitrary URLs and oversized input",async()=>{for(const image of ["https://example.com/image.png","data:image/png;base64,"+"A".repeat(3_000_000)]){const r=res();await handler(req({clientId:"studio",image}),r);expect(r.status).toHaveBeenCalledWith(400);}expect(mocks.fetch).not.toHaveBeenCalled();});
it("enforces daily quota",async()=>{mocks.transaction.mockResolvedValue(false);const r=res();await handler(req(),r);expect(r.status).toHaveBeenCalledWith(429);expect(mocks.fetch).not.toHaveBeenCalled();});
it("does not expose upstream errors containing documents or secrets",async()=>{mocks.fetch.mockResolvedValue({ok:false,json:vi.fn(()=>({error:image}))});const r=res();await handler(req(),r);expect(r.status).toHaveBeenCalledWith(502);expect(JSON.stringify(r.json.mock.calls)).not.toContain(image);expect(JSON.stringify(r.json.mock.calls)).not.toContain("test-secret");});
it("rejects empty or truncated responses",async()=>{for(const choice of [{message:{content:""},finish_reason:"stop"},{message:{content:"partial"},finish_reason:"length"}]){mocks.fetch.mockResolvedValue({ok:true,json:async()=>({choices:[choice]})});const r=res();await handler(req(),r);expect(r.status).toHaveBeenCalledWith(502);}});
it("returns bounded text and pins the upstream model",async()=>{mocks.fetch.mockResolvedValue({ok:true,json:async()=>({choices:[{message:{content:"table"},finish_reason:"stop"}]})});const r=res();await handler(req(),r);expect(r.json).toHaveBeenCalledWith({text:"table",model:"nvidia/nemotron-parse-2.0"});expect(JSON.parse(mocks.fetch.mock.calls[0][1].body).model).toBe("nvidia/nemotron-parse-2.0");});
