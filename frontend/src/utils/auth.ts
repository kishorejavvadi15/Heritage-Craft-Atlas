const USERS_STORAGE_KEY = 'heritageAtlasUsers';
const AUTH_STORAGE_KEY = 'isAuthenticated';
const USER_EMAIL_STORAGE_KEY = 'userEmail';
const ADMIN_EMAILS = ['admin@heritageatlas.com'];

type StoredUser = {
  email: string;
  password: string;
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const readUsers = (): StoredUser[] => {
  const rawUsers = localStorage.getItem(USERS_STORAGE_KEY);

  if (!rawUsers) {
    return [];
  }

  try {
    const parsedUsers = JSON.parse(rawUsers) as StoredUser[];
    return Array.isArray(parsedUsers) ? parsedUsers : [];
  } catch {
    return [];
  }
};

const writeUsers = (users: StoredUser[]) => {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

export const authStorage = {
  register(email: string, password: string) {
    const normalizedEmail = normalizeEmail(email);
    const users = readUsers();
    const existingUser = users.find((user) => user.email === normalizedEmail);

    if (existingUser) {
      return {
        success: false,
        message: 'This email is already registered. Please login instead.',
      };
    }

    writeUsers([
      ...users,
      {
        email: normalizedEmail,
        password,
      },
    ]);

    return {
      success: true,
      message: 'Registration successful. You can now use these details to login.',
    };
  },

  login(email: string, password: string) {
    const normalizedEmail = normalizeEmail(email);
    const users = readUsers();
    const matchedUser = users.find((user) => user.email === normalizedEmail);

    if (!matchedUser) {
      return {
        success: false,
        message: 'No account found for this email. Please register first.',
      };
    }

    if (matchedUser.password !== password) {
      return {
        success: false,
        message: 'Incorrect password. Please try again.',
      };
    }

    localStorage.setItem(AUTH_STORAGE_KEY, 'true');
    localStorage.setItem(USER_EMAIL_STORAGE_KEY, normalizedEmail);

    return {
      success: true,
      message: 'Login successful.',
    };
  },

  logout() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(USER_EMAIL_STORAGE_KEY);
  },

  isAuthenticated() {
    return localStorage.getItem(AUTH_STORAGE_KEY) === 'true';
  },

  getCurrentUserEmail() {
    return localStorage.getItem(USER_EMAIL_STORAGE_KEY);
  },

  isAdmin() {
    const email = localStorage.getItem(USER_EMAIL_STORAGE_KEY);
    return !!email && ADMIN_EMAILS.includes(email);
  },
};
