import React, { useState, useEffect, useRef } from 'react';
import { apiCall } from '../api/client';
import { toast } from 'react-hot-toast';

const IconCamera = (props) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const IconTrash = (props) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </svg>
);

// Helper to construct profile image URL
export const getProfilePictureUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const baseUrl = 'http://localhost:5000';
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};


export default function ProfileModal({ isOpen, onClose, user, onProfileUpdated }) {
  const [fullName, setFullName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef(null);

  // Sync state when modal opens or user prop changes
  useEffect(() => {
    if (isOpen && user) {
      setFullName(user.full_name || '');
      setSelectedFile(null);
      setPreviewUrl(getProfilePictureUrl(user.profile_picture));
    }
  }, [isOpen, user]);

  // Clean up object URL on unmount or file change
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    // 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB.');
      return;
    }

    // Clean up previous blob if any
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveSelectedFile = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(getProfilePictureUrl(user?.profile_picture));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveExistingPhoto = async () => {
    try {
      setSaving(true);
      const res = await apiCall('/auth/profile/picture', {
        method: 'DELETE',
      });

      if (res.success) {
        if (previewUrl && previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        // Update localStorage
        const storedUser = localStorage.getItem('ems_admin_user');
        const currentUser = storedUser ? JSON.parse(storedUser) : {};
        const updatedUser = { ...currentUser, profile_picture: null };
        localStorage.setItem('ems_admin_user', JSON.stringify(updatedUser));

        // Notify parent to update react state
        if (onProfileUpdated) {
          onProfileUpdated(updatedUser);
        }

        toast.success(res.message || 'Profile photo removed successfully!');
      } else {
        toast.error(res.message || 'Failed to remove profile photo.');
      }
    } catch (err) {
      console.error('Failed to remove photo:', err);
      toast.error('Network error removing photo.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      toast.error('Full name cannot be empty.');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('full_name', trimmedName);
      if (selectedFile) {
        formData.append('profile_picture', selectedFile);
      }

      const res = await apiCall('/auth/profile', {
        method: 'PUT',
        body: formData,
      });

      if (res.success && res.user) {
        // Update localStorage
        const storedUser = localStorage.getItem('ems_admin_user');
        const currentUser = storedUser ? JSON.parse(storedUser) : {};
        const updatedUser = { ...currentUser, ...res.user };
        localStorage.setItem('ems_admin_user', JSON.stringify(updatedUser));

        // Notify parent to update react state
        if (onProfileUpdated) {
          onProfileUpdated(updatedUser);
        }

        toast.success(res.message || 'Profile updated successfully!');
        onClose();
      } else {
        toast.error(res.message || 'Failed to update profile.');
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      toast.error('Network error updating profile.');
    } finally {
      setSaving(false);
    }
  };

  const initial = (fullName || user?.full_name || 'A').charAt(0).toUpperCase();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="profile-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="profile-modal-header">
          <div>
            <h3 className="profile-modal-title">Edit Profile</h3>
            <p className="profile-modal-subtitle">
              Update your account details and profile photo
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="profile-modal-form">
          <div className="profile-modal-body">
            {/* Avatar Preview & Upload Area */}
            <div className="profile-avatar-section">
              <div className="profile-avatar-wrapper">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Profile Avatar Preview"
                    className="profile-avatar-img"
                  />
                ) : (
                  <div className="profile-avatar-initials">
                    {initial}
                  </div>
                )}

                <button
                  type="button"
                  title="Upload profile picture"
                  aria-label="Upload profile picture"
                  onClick={() => fileInputRef.current?.click()}
                  className="profile-avatar-badge"
                >
                  <IconCamera />
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />

              <div className="profile-avatar-actions">
                <button
                  type="button"
                  className="btn btn-secondary profile-btn-sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={saving}
                >
                  Change Photo
                </button>
                {selectedFile ? (
                  <button
                    type="button"
                    className="btn btn-secondary profile-btn-reset"
                    onClick={handleRemoveSelectedFile}
                    title="Undo photo change"
                    disabled={saving}
                  >
                    <IconTrash /> Reset
                  </button>
                ) : user?.profile_picture ? (
                  <button
                    type="button"
                    className="btn btn-secondary profile-btn-reset"
                    onClick={handleRemoveExistingPhoto}
                    title="Remove profile photo"
                    disabled={saving}
                  >
                    <IconTrash /> Remove
                  </button>
                ) : null}
              </div>
              <span className="profile-avatar-hint">
                PNG, JPG or WebP (max. 5MB)
              </span>
            </div>

            {/* Editable Full Name */}
            <div className="profile-form-group">
              <label className="profile-form-label">
                Full Name <span className="profile-required-mark">*</span>
              </label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            {/* Read-Only: Email */}
            <div className="profile-form-group">
              <label className="profile-form-label">
                Email Address
              </label>
              <input
                type="email"
                disabled
                className="form-control profile-input-readonly"
                value={user?.email || ''}
              />
              <small className="profile-field-hint">
                Email address is read-only.
              </small>
            </div>

            {/* Read-Only: Role */}
            <div className="profile-form-group">
              <label className="profile-form-label">
                Role
              </label>
              <input
                type="text"
                disabled
                className="form-control profile-input-readonly"
                value={user?.role || ''}
              />
            </div>

            {/* Read-Only: Contact Number */}
            <div className="profile-form-group">
              <label className="profile-form-label">
                Contact Number
              </label>
              <input
                type="text"
                disabled
                className="form-control profile-input-readonly"
                value={user?.contact_number || 'Not provided'}
              />
            </div>
          </div>

          <div className="profile-modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving Changes…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
