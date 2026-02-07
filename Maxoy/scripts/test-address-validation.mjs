import assert from "node:assert/strict";
import { validateAddress, formatPhoneTR, normalizePhone } from "../lib/addressBook.js";

const validAddress = {
  name: "Ayşe Yılmaz",
  phone: "0555 123 45 67",
  city: "İstanbul",
  district: "Kadıköy",
  addressLine: "Moda Mah. test sok. no 1",
  postalCode: "34000",
  company: "Maxoy",
  taxNo: "1234567890",
};

const formatted = formatPhoneTR(validAddress.phone);
assert.equal(normalizePhone(formatted).length, 10);

const validResult = validateAddress({ ...validAddress, phone: formatted });
assert.equal(validResult.valid, true);

const missingResult = validateAddress({});
assert.equal(missingResult.valid, false);
assert.ok(missingResult.errors.name);
assert.ok(missingResult.errors.phone);

const badPhoneResult = validateAddress({
  ...validAddress,
  phone: "123",
});
assert.equal(badPhoneResult.valid, false);
assert.ok(badPhoneResult.errors.phone);

const optionalResult = validateAddress({
  name: "Test",
  phone: "0555 123 45 67",
  city: "Ankara",
  district: "Çankaya",
  addressLine: "Adres",
  postalCode: "",
});
assert.equal(optionalResult.valid, true);

console.log("Address validation tests passed.");
