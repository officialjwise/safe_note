export const validators = {
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
    let score = 0;

    // Min 8 characters
    if (password.length >= 8) score += 1;

    // Has uppercase
    if (/[A-Z]/.test(password)) score += 1;

    // Has number
    if (/\d/.test(password)) score += 1;

    // Has special character
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;

    if (score <= 1) return 'weak';
    if (score <= 2) return 'medium';
    return 'strong';
  },

  isPasswordValid(password: string): boolean {
    // Min 8 chars, 1 uppercase, 1 digit, 1 special char
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /\d/.test(password) &&
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    );
  },

  doPasswordsMatch(password: string, confirmPassword: string): boolean {
    return password === confirmPassword;
  },

  sanitizeInput(input: string, maxLength: number = 1000): string {
    return input.trim().slice(0, maxLength);
  },
};
