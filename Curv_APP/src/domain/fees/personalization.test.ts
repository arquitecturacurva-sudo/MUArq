import { describe, expect, it } from "vitest";
import { defaultFeeSettings, feePayments, feeSettingsErrors, isFeeSettings } from "./personalization";

describe("fee personalization", () => {
  it("preserves legacy defaults and validates custom rates", () => {
    expect(isFeeSettings(defaultFeeSettings)).toBe(true);
    for (const manualRate of ["", "0", "-5", "Infinity", "12.345"]) {
      expect(feeSettingsErrors({...defaultFeeSettings, mode:"custom", manualRate}).rate).toBeTruthy();
    }
    expect(isFeeSettings({...defaultFeeSettings, mode:"custom", manualRate:"38.25"})).toBe(true);
  });
  it("rejects empty, incomplete, overallocated and duplicate milestones", () => {
    for (const milestones of [[], [{id:"a",name:"",percent:"100"}], [{id:"a",name:"A",percent:"0"}], [{id:"a",name:"A",percent:"101"}], [{id:"a",name:"A",percent:"99"}], [{id:"a",name:"A",percent:"50"},{id:"a",name:"B",percent:"50"}]]) {
      expect(isFeeSettings({...defaultFeeSettings,milestones})).toBe(false);
    }
  });
  it("allocates cents exactly and preserves names and order", () => {
    for (const total of [0, 1, 123.45, 17501.19, 12500]) {
      const payments=feePayments(total,defaultFeeSettings.milestones,true);
      expect(payments.reduce((sum,h)=>sum+Math.round(h.m*100),0)).toBe(Math.round(total*100));
      expect(payments.map(h=>h.n)).toEqual(["Adelanto","Mitad","Entrega"]);
    }
    expect(feePayments(123.45,[{id:"one",name:"Único",percent:"100"}],true)[0].m).toBe(123.45);
  });
  it("supports decimal percentages and does not balance incomplete previews", () => {
    const milestones=[{id:"a",name:"A",percent:"33.33"},{id:"b",name:"B",percent:"33.33"},{id:"c",name:"C",percent:"33.34"}];
    expect(isFeeSettings({...defaultFeeSettings,milestones})).toBe(true);
    expect(feePayments(100,milestones,true).map(h=>h.m)).toEqual([33.33,33.33,33.34]);
    expect(feePayments(100,[milestones[0]],false)[0].m).toBe(33.33);
  });
});
