import { describe, expect, it } from "vitest";
import { calculateFees, type FeesInput } from "./calculateFees";
// Expected values captured from ToolCalc at a804766, before extracting its calculation.
const base: FeesInput = {"ti":"Vivienda","et":"Anteproyecto","ar":"100","co":"Media","ur":"Normal","tc":"Particular","mo":"Suma alzada","mg":0,"dc":0,"rd":50,"ig":true,"rx":0,"vx":0,"nx":0};
describe("legacy fee calculation equivalence", () => {
  it.each([
    ["Vivienda","Levantamiento",8,950],
    ["Vivienda","Anteproyecto",35,4150],
    ["Vivienda","Proyecto arquitectónico",55,6500],
    ["Vivienda","Expediente técnico",78,9200],
    ["Vivienda","Supervisión",12,1400],
    ["Comercial","Levantamiento",10,1200],
    ["Comercial","Anteproyecto",38,4500],
    ["Comercial","Proyecto arquitectónico",60,7100],
    ["Comercial","Expediente técnico",85,10050],
    ["Comercial","Supervisión",14,1650],
    ["Oficina","Levantamiento",9,1050],
    ["Oficina","Anteproyecto",36,4250],
    ["Oficina","Proyecto arquitectónico",58,6850],
    ["Oficina","Expediente técnico",82,9700],
    ["Oficina","Supervisión",13,1550],
    ["Remodelación","Levantamiento",12,1400],
    ["Remodelación","Anteproyecto",42,4950],
    ["Remodelación","Proyecto arquitectónico",68,8000],
    ["Remodelación","Expediente técnico",95,11200],
    ["Remodelación","Supervisión",16,1900],
    ["Interiorismo","Levantamiento",11,1300],
    ["Interiorismo","Anteproyecto",40,4700],
    ["Interiorismo","Proyecto arquitectónico",65,7650],
    ["Interiorismo","Expediente técnico",90,10600],
    ["Interiorismo","Supervisión",15,1750],
    ["Industrial pequeño","Levantamiento",8,950],
    ["Industrial pequeño","Anteproyecto",30,3550],
    ["Industrial pequeño","Proyecto arquitectónico",48,5650],
    ["Industrial pequeño","Expediente técnico",70,8250],
    ["Industrial pequeño","Supervisión",12,1400]
  ])("retains %s / %s tariffs", (ti, et, t, total) => {
    const result = calculateFees({ ...base, ti: String(ti), et: String(et) });
    expect(result.t).toBe(t); expect(result.tot).toBe(total);
  });
  it("defaults and independently rounded milestones", () => {
    expect(calculateFees({ ...base, ...{} })).toEqual({"t":35,"b":3500,"adj":3500,"ext":0,"sub":3500,"igv":630,"tot":4150,"rMin":3818,"rMax":4482,"hitos":[{"n":"Adelanto","p":0.5,"m":2080},{"n":"Mitad","p":0.25,"m":1040},{"n":"Entrega","p":0.25,"m":1040}]});
  });
  it("empty area", () => {
    expect(calculateFees({ ...base, ...{"ar":""} })).toEqual({"t":35,"b":0,"adj":0,"ext":0,"sub":0,"igv":0,"tot":0,"rMin":0,"rMax":0,"hitos":[{"n":"Adelanto","p":0.5,"m":0},{"n":"Mitad","p":0.25,"m":0},{"n":"Entrega","p":0.25,"m":0}]});
  });
  it("no IGV and no rounding step", () => {
    expect(calculateFees({ ...base, ...{"ig":false,"rd":0,"ar":"123.45"} })).toEqual({"t":35,"b":4320.75,"adj":4320.75,"ext":0,"sub":4320.75,"igv":0,"tot":4321,"rMin":3975,"rMax":4667,"hitos":[{"n":"Adelanto","p":0.5,"m":2160},{"n":"Mitad","p":0.25,"m":1080},{"n":"Entrega","p":0.25,"m":1080}]});
  });
  it("all adjustments and numeric strings", () => {
    expect(calculateFees({ ...base, ...{"ar":"1600","co":"Muy alta","ur":"Urgente","tc":"Institucional","mo":"Diseño + Build","mg":"12.5","dc":"7","rx":"2","vx":"3","nx":"4","rd":"100"} })).toEqual({"t":35,"b":56000,"adj":117723.71519999998,"ext":2020,"sub":119743.71519999998,"igv":21553.868735999997,"tot":141300,"rMin":129996,"rMax":152604,"hitos":[{"n":"Adelanto","p":0.5,"m":70650},{"n":"Mitad","p":0.25,"m":35330},{"n":"Entrega","p":0.25,"m":35330}]});
  });
  it("unknown legacy choices use neutral factors", () => {
    expect(calculateFees({ ...base, ...{"ti":"legacy","et":"legacy","co":"legacy","mo":"legacy","rx":2} })).toEqual({"t":0,"b":0,"adj":0,"ext":480,"sub":480,"igv":86.39999999999999,"tot":550,"rMin":506,"rMax":594,"hitos":[{"n":"Adelanto","p":0.5,"m":280},{"n":"Mitad","p":0.25,"m":140},{"n":"Entrega","p":0.25,"m":140}]});
  });
  it("discount is not silently clamped", () => {
    expect(calculateFees({ ...base, ...{"dc":125,"ig":false} })).toEqual({"t":35,"b":3500,"adj":-875,"ext":0,"sub":-875,"igv":0,"tot":-850,"rMin":-782,"rMax":-918,"hitos":[{"n":"Adelanto","p":0.5,"m":-420},{"n":"Mitad","p":0.25,"m":-210},{"n":"Entrega","p":0.25,"m":-210}]});
  });
  it("invalid numeric input keeps legacy fallback", () => {
    expect(calculateFees({ ...base, ...{"ar":"invalid","mg":"invalid","rx":"invalid"} })).toEqual({"t":35,"b":0,"adj":0,"ext":0,"sub":0,"igv":0,"tot":0,"rMin":0,"rMax":0,"hitos":[{"n":"Adelanto","p":0.5,"m":0},{"n":"Mitad","p":0.25,"m":0},{"n":"Entrega","p":0.25,"m":0}]});
  });
});
