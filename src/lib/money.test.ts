import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatEuroInput, parseEuroInput } from "./money";

describe("parseEuroInput", () => {
  const cents = (input: string) => {
    const result = parseEuroInput(input);
    return result.ok ? result.cents : "ongeldig";
  };

  it("leest gewone bedragen", () => {
    assert.equal(cents("30"), 3000);
    assert.equal(cents("255,50"), 25550);
    assert.equal(cents("€ 40"), 4000);
    assert.equal(cents("12.5"), 1250);
  });

  it("leest duizendtallen met punt", () => {
    assert.equal(cents("1.000"), 100000);
    assert.equal(cents("€ 1.000,00"), 100000);
    assert.equal(cents("1000"), 100000);
  });

  it("leeg betekent: nog geen prijs", () => {
    assert.equal(cents(""), null);
    assert.equal(cents("  "), null);
  });

  it("weigert onzin en negatieve bedragen", () => {
    assert.equal(cents("abc"), "ongeldig");
    assert.equal(cents("-5"), "ongeldig");
    assert.equal(cents("12,345"), "ongeldig");
    assert.equal(cents("1.00.0"), "ongeldig");
  });
});

describe("formatEuroInput", () => {
  it("toont hele euro's zonder centen", () => {
    assert.equal(formatEuroInput(3000), "30");
    assert.equal(formatEuroInput(25550), "255,50");
    assert.equal(formatEuroInput(100000), "1000");
    assert.equal(formatEuroInput(null), "");
  });
});
