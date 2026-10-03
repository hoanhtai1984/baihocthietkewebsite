import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateMe, changePassword } from '../api/auth';
import { setAuth, updateStoredUser } from '../utils/authStorage';
import { showToast, apiErrorMessage } from '../utils/toast';
import useDocumentTitle from '../hooks/useDocumentTitle';

function Profile() {
  useDocumentTitle('Tài khoản của tôi');
  const { user } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  async function handleProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileError('');
    setSavingProfile(true);
    try {
      const updated = await updateMe({ name: name.trim(), phone: phone.trim() });
      updateStoredUser(updated);
      showToast('Đã cập nhật thông tin');
    } catch (err) {
      setProfileError(apiErrorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError('');
    if (newPassword.length < 6) {
      setPasswordError('Mật khẩu mới cần ít nhất 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Nhập lại mật khẩu mới chưa khớp');
      return;
    }
    setSavingPassword(true);
    try {
      // Server thu hồi mọi phiên cũ và trả phiên mới cho thiết bị này.
      const session = await changePassword({ currentPassword, newPassword });
      setAuth(session.user, session.accessToken, session.refreshToken);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Đã đổi mật khẩu');
    } catch (err) {
      setPasswordError(apiErrorMessage(err));
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="container py-4" style={{ maxWidth: 720 }}>
      <h1 className="fw-bold fs-3 mb-4">Tài khoản của tôi</h1>

      <form className="border rounded-3 p-3 mb-4" onSubmit={handleProfile}>
        <h2 className="fw-bold fs-5 mb-3">Thông tin cá nhân</h2>
        <label className="form-label small text-muted mb-1">Email (không đổi được)</label>
        <input className="form-control mb-2" value={user?.email || ''} disabled />
        <label className="form-label small text-muted mb-1">Họ tên</label>
        <input className="form-control mb-2" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required />
        <label className="form-label small text-muted mb-1">Số điện thoại</label>
        <input className="form-control mb-3" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Ví dụ 0912345678" />
        {profileError && <p className="text-danger small">{profileError}</p>}
        <button type="submit" className="btn btn-warning fw-bold" disabled={savingProfile}>
          {savingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </form>

      <form className="border rounded-3 p-3" onSubmit={handlePassword}>
        <h2 className="fw-bold fs-5 mb-3">Đổi mật khẩu</h2>
        <input className="form-control mb-2" type="password" placeholder="Mật khẩu hiện tại" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
        <input className="form-control mb-2" type="password" placeholder="Mật khẩu mới (ít nhất 6 ký tự)" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
        <input className="form-control mb-3" type="password" placeholder="Nhập lại mật khẩu mới" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
        {passwordError && <p className="text-danger small">{passwordError}</p>}
        <button type="submit" className="btn btn-outline-primary fw-bold" disabled={savingPassword}>
          {savingPassword ? 'Đang lưu...' : 'Đổi mật khẩu'}
        </button>
      </form>
    </div>
  );
}

export default Profile;
