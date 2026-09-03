/**
 * Spionase Kelompok 3 - Authentication & Profile Management System
 * Supports Supabase Cloud Auth + Local Demo Mode Fallback
 */

const STORAGE_KEY_USERS = 'spionase_k3_users';
const STORAGE_KEY_SESSION = 'spionase_k3_current_user';

// Initialize default local test account
function initLocalAuth() {
  if (!localStorage.getItem(STORAGE_KEY_USERS)) {
    const defaultUsers = [
      {
        id: '1',
        name: 'Dimas Pratama',
        email: 'user@spionase.com',
        password: 'password123',
        role: 'Pembaca',
        phone: '+62 812 3456 7890',
        bio: 'Penggemar berita teknologi, kecerdasan buatan, dan sains antariksa.',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        joinedDate: '23 Oktober 2026'
      }
    ];
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(defaultUsers));
  }
}

// Check if using Supabase or Local
function isUsingSupabase() {
  return typeof supabaseClient !== 'undefined' && supabaseClient !== null;
}

// Get currently logged-in user (sync for UI render)
function getCurrentUser() {
  const sessionData = localStorage.getItem(STORAGE_KEY_SESSION);
  return sessionData ? JSON.parse(sessionData) : null;
}

// Register a new user
async function registerUser(name, email, password, role = 'Pembaca') {
  const normalizedEmail = email.trim().toLowerCase();

  // --- SUPABASE CLOUD AUTH ---
  if (isUsingSupabase()) {
    try {
      const defaultAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';
      const { data, error } = await supabaseClient.auth.signUp({
        email: normalizedEmail,
        password: password,
        options: {
          data: {
            full_name: name.trim(),
            role: role,
            avatar_url: defaultAvatar
          }
        }
      });

      if (error) {
        return { success: false, message: error.message };
      }

      const userData = {
        id: data.user ? data.user.id : Date.now().toString(),
        name: name.trim(),
        email: normalizedEmail,
        role: role,
        phone: '',
        bio: '',
        avatar: defaultAvatar,
        joinedDate: new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
      };

      if (data.session) {
        localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(userData));
        return { success: true, user: userData, message: 'Akun berhasil terdaftar dan masuk via Supabase!' };
      }

      return { 
        success: true, 
        user: userData, 
        message: 'Akun berhasil dibuat! Silakan cek email Anda untuk konfirmasi, atau langsung login.' 
      };
    } catch (err) {
      return { success: false, message: err.message || 'Terjadi kesalahan saat registrasi.' };
    }
  }

  // --- LOCAL DEMO FALLBACK ---
  initLocalAuth();
  const users = JSON.parse(localStorage.getItem(STORAGE_KEY_USERS) || '[]');
  if (users.some(u => u.email === normalizedEmail)) {
    return { success: false, message: 'Email sudah terdaftar dalam penyimpanan demo.' };
  }

  const newUser = {
    id: Date.now().toString(),
    name: name.trim(),
    email: normalizedEmail,
    password: password,
    role: role,
    phone: '',
    bio: '',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    joinedDate: new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
  };

  users.push(newUser);
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(newUser));
  return { success: true, user: newUser, message: 'Akun berhasil didaftarkan (Mode Demo)!' };
}

// Login user
async function loginUser(email, password) {
  const normalizedEmail = email.trim().toLowerCase();

  // --- SUPABASE CLOUD AUTH ---
  if (isUsingSupabase()) {
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: normalizedEmail,
        password: password
      });

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          return { 
            success: false, 
            message: 'Email belum dikonfirmasi. Silakan periksa inbox email Anda, atau nonaktifkan "Confirm email" di Dashboard Supabase (Authentication -> Providers -> Email).' 
          };
        }
        return { success: false, message: error.message };
      }

      const userMeta = (data.user && data.user.user_metadata) || {};
      const userData = {
        id: data.user.id,
        name: userMeta.full_name || data.user.email.split('@')[0],
        email: data.user.email,
        role: userMeta.role || 'Pembaca',
        phone: userMeta.phone || '',
        bio: userMeta.bio || '',
        avatar: userMeta.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
      };

      localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(userData));
      return { success: true, user: userData, message: 'Berhasil masuk via Supabase!' };
    } catch (err) {
      return { success: false, message: err.message || 'Terjadi kesalahan saat masuk.' };
    }
  }

  // --- LOCAL DEMO FALLBACK ---
  initLocalAuth();
  const users = JSON.parse(localStorage.getItem(STORAGE_KEY_USERS) || '[]');
  const user = users.find(u => u.email === normalizedEmail && u.password === password);
  if (!user) {
    return { success: false, message: 'Email atau kata sandi tidak valid.' };
  }

  localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(user));
  return { success: true, user: user, message: 'Berhasil masuk (Mode Demo)!' };
}

// Update User Profile (Settings)
async function updateUserProfile(name, role, phone, bio, avatar) {
  const currentUser = getCurrentUser();
  if (!currentUser) return { success: false, message: 'Belum terautentikasi.' };

  const updatedUser = {
    ...currentUser,
    name: name.trim(),
    role: role,
    phone: phone ? phone.trim() : '',
    bio: bio ? bio.trim() : '',
    avatar: avatar || currentUser.avatar
  };

  // Sync with Supabase
  if (isUsingSupabase()) {
    try {
      const { error } = await supabaseClient.auth.updateUser({
        data: {
          full_name: updatedUser.name,
          role: updatedUser.role,
          phone: updatedUser.phone,
          bio: updatedUser.bio,
          avatar_url: updatedUser.avatar
        }
      });
      if (error) {
        console.warn('Supabase profile update notice:', error.message);
      }
    } catch (e) {
      console.warn('Supabase sync error:', e);
    }
  }

  // Update in local users array if exists
  const users = JSON.parse(localStorage.getItem(STORAGE_KEY_USERS) || '[]');
  const userIdx = users.findIndex(u => u.email === currentUser.email);
  if (userIdx !== -1) {
    users[userIdx] = { ...users[userIdx], ...updatedUser };
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  }

  // Update session
  localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(updatedUser));
  updateHeaderAuthUI();
  return { success: true, user: updatedUser };
}

// Change User Password
async function changeUserPassword(newPassword) {
  if (isUsingSupabase()) {
    try {
      const { error } = await supabaseClient.auth.updateUser({ password: newPassword });
      if (error) return { success: false, message: error.message };
      return { success: true, message: 'Kata sandi berhasil diperbarui di Supabase.' };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }

  // Local fallback
  const currentUser = getCurrentUser();
  const users = JSON.parse(localStorage.getItem(STORAGE_KEY_USERS) || '[]');
  const userIdx = users.findIndex(u => u.email === currentUser.email);
  if (userIdx !== -1) {
    users[userIdx].password = newPassword;
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  }
  return { success: true, message: 'Kata sandi berhasil diperbarui (Mode Demo).' };
}

// Logout user
async function logoutUser() {
  if (isUsingSupabase()) {
    try {
      await supabaseClient.auth.signOut();
    } catch (e) {
      console.log('Supabase signout:', e);
    }
  }
  localStorage.removeItem(STORAGE_KEY_SESSION);
  window.location.href = 'index.html';
}

// Update header UI across pages based on login state
function updateHeaderAuthUI() {
  const authContainers = document.querySelectorAll('.header-auth');
  const user = getCurrentUser();

  authContainers.forEach(container => {
    if (user) {
      container.innerHTML = `
        <div class="user-menu-wrapper">
          <div class="user-profile-badge" id="userMenuBtn" onclick="toggleUserMenu(event)">
            <img src="${user.avatar}" alt="${user.name}" class="nav-user-avatar">
            <span class="nav-user-name">${user.name.split(' ')[0]}</span>
            <svg class="dropdown-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>
          <div class="user-dropdown-menu" id="userDropdown">
            <div class="dropdown-user-info">
              <span class="user-fullname">${user.name}</span>
              <span class="user-role-tag">${user.role || 'Pembaca'}</span>
              <span class="user-email-text">${user.email}</span>
            </div>
            <div class="dropdown-divider"></div>
            <a href="profile.html" class="dropdown-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              Pengaturan Profil
            </a>
            <a href="index.html#popular" class="dropdown-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
              Artikel Tersimpan
            </a>
            <button onclick="logoutUser()" class="dropdown-item logout-btn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              Keluar Akun
            </button>
          </div>
        </div>
      `;
    } else {
      container.innerHTML = `
        <a href="auth.html?mode=signin" class="btn-sign-in">Sign In</a>
        <a href="auth.html?mode=signup" class="btn-sign-up">Sign Up</a>
      `;
    }
  });
}

function toggleUserMenu(e) {
  e.stopPropagation();
  const dropdown = document.getElementById('userDropdown');
  if (dropdown) {
    dropdown.classList.toggle('show');
  }
}

// Close dropdown on outside click
document.addEventListener('click', () => {
  const dropdown = document.getElementById('userDropdown');
  if (dropdown && dropdown.classList.contains('show')) {
    dropdown.classList.remove('show');
  }
});

// Check and sync Supabase session if available
async function syncSupabaseSession() {
  if (isUsingSupabase()) {
    try {
      const { data } = await supabaseClient.auth.getSession();
      if (data && data.session) {
        const u = data.session.user;
        const userMeta = u.user_metadata || {};
        const userData = {
          id: u.id,
          name: userMeta.full_name || u.email.split('@')[0],
          email: u.email,
          role: userMeta.role || 'Pembaca',
          phone: userMeta.phone || '',
          bio: userMeta.bio || '',
          avatar: userMeta.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
        };
        localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(userData));
        updateHeaderAuthUI();
      }
    } catch (e) {
      console.log('Session check error:', e);
    }
  }
}

// Run UI check when document loads
document.addEventListener('DOMContentLoaded', () => {
  initLocalAuth();
  updateHeaderAuthUI();
  syncSupabaseSession();
});
