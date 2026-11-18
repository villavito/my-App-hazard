// Philippine mobile numbers, shared by the signup and profile screens.
// The input holds just the 10 digits after +63 ("9171234567"); it's saved as
// "+639171234567".

// Keeps only the 10 national digits. A pasted "09171234567" or
// "+63 917 123 4567" is accepted too - the leading 0 / 63 is stripped.
export function mobileDigits(input: string) {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("63")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return digits.slice(0, 10);
}

export const isValidMobile = (digits: string) => /^9\d{9}$/.test(digits);

// "9171234567" -> "917 123 4567" while typing.
export const formatMobile = (digits: string) =>
  [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6)]
    .filter(Boolean)
    .join(" ");

export const toE164Mobile = (digits: string) => `+63${digits}`;

// Why the digits aren't a valid mobile number yet.
export const mobileErrorMessage = (digits: string) =>
  digits.length === 0
    ? "Please enter your mobile number."
    : !digits.startsWith("9")
      ? "Mobile numbers start with 9, e.g. 917 123 4567."
      : "Enter all 10 digits, e.g. 917 123 4567.";
