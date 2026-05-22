import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../auth/AuthContext";
import { PROFILE } from "../../services/api";
import "../css/ProfilePage.css";

export default function ProfilePage() {
    const { session, authFetch } = useAuth();

    const [form, setForm] = useState({
        firstname: "",
        lastname: "",
        email: "",
        phone: "",
        currentPassword: "",
        newPassword: "",
    });

    const [hasAvatar, setHasAvatar] = useState(false);
    const [avatarSrc, setAvatarSrc] = useState(null);
    const [avatarHover, setAvatarHover] = useState(false);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [saving, setSaving] = useState(false);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    const fileRef = useRef();

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    // ── Load profile on mount ─────────────────────────────────────────────────
    useEffect(() => {
        (async () => {
            try {
                const data = await authFetch(PROFILE.profile);
                setForm(f => ({
                    ...f,
                    firstname: data.firstname || "",
                    lastname: data.lastname || "",
                    email: data.email || "",
                    phone: data.phone || "",
                }));
                setHasAvatar(!!data.hasAvatar);
                if (data.hasAvatar) fetchAvatar();
            } catch (e) {
                setError("Could not load profile.");
            } finally {
                setLoadingProfile(false);
            }
        })();
    }, []);

    const fetchAvatar = async () => {
        try {
            const res = await fetch(PROFILE.avatar, {
                headers: { Authorization: `Bearer ${session?.token}` },
            });
            if (!res.ok) { setHasAvatar(false); return; }
            const blob = await res.blob();
            setAvatarSrc(prev => {
                if (prev) URL.revokeObjectURL(prev); // free previous blob
                return URL.createObjectURL(blob);
            });
        } catch {
            setHasAvatar(false);
        }
    };

    // ── Save profile ──────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        setSaving(true);
        setSuccess("");
        setError("");
        try {
            const res = await authFetch(PROFILE.profile, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            setSuccess(res.message || "Profile updated successfully");
            setForm(f => ({ ...f, currentPassword: "", newPassword: "" }));
        } catch (e) {
            setError(e.message || "Update failed");
        } finally {
            setSaving(false);
        }
    };

    // ── Avatar upload ─────────────────────────────────────────────────────────
    const handleAvatarChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAvatarUploading(true);
        setSuccess("");
        setError("");
        try {
            const fd = new FormData();
            fd.append("file", file);
            const res = await fetch(PROFILE.avatar, {
                method: "POST",
                headers: { Authorization: `Bearer ${session?.token}` },
                body: fd,
            });
            if (!res.ok) throw new Error("Avatar upload failed");
            const data = await res.json();
            setHasAvatar(true);
            fetchAvatar();
            setSuccess(data.message || "Avatar updated");
        } catch (e) {
            setError(e.message || "Upload failed");
        } finally {
            setAvatarUploading(false);
            e.target.value = "";
        }
    };

    // ── Avatar delete ─────────────────────────────────────────────────────────
    const handleAvatarDelete = async () => {
        setAvatarUploading(true);
        setSuccess("");
        setError("");
        try {
            const res = await authFetch(PROFILE.avatar, { method: "DELETE" });
            setHasAvatar(false);
            setAvatarSrc(null);
            setSuccess(res.message || "Avatar removed");
        } catch (e) {
            setError(e.message || "Delete failed");
        } finally {
            setAvatarUploading(false);
        }
    };

    if (loadingProfile) return <div className="profile-page"><div className="profile-loading">Loading profile…</div></div>;

    return (
        <div className="profile-page">
            <div className="profile-card">

                {/* Header */}
                <div className="profile-header">
                    <div>
                        <div className="profile-title">Personal Profile</div>
                        <div className="profile-sub">Manage your account information</div>
                    </div>
                </div>

                {/* Avatar */}
                <div className="profile-avatar-row">
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleAvatarChange}
                    />
                    <div
                        className={`profile-avatar-wrap ${avatarHover ? "avatar-hover" : ""}`}
                        onMouseEnter={() => setAvatarHover(true)}
                        onMouseLeave={() => setAvatarHover(false)}
                        onClick={() => !avatarUploading && fileRef.current?.click()}
                        title="Click to change photo"
                    >
                        {avatarUploading ? (
                            <div className="avatar-spinner" />
                        ) : hasAvatar && avatarSrc ? (
                            <img
                                src={avatarSrc}
                                alt="avatar"
                                className="profile-avatar-img"
                                onError={() => { setAvatarSrc(null); setHasAvatar(false); }}
                            />
                        ) : (
                            <div className="avatar-placeholder">
                                {form.firstname ? form.firstname[0].toUpperCase() : "?"}
                            </div>
                        )}
                        <div className="avatar-overlay">
                            <span className="avatar-overlay-icon">📷</span>
                        </div>
                    </div>

                    <div className="profile-avatar-info">
                        <div className="profile-avatar-name">
                            {(form.firstname || form.lastname)
                                ? `${form.firstname} ${form.lastname}`.trim()
                                : "—"}
                        </div>
                        {hasAvatar && (
                            <button
                                className="avatar-remove-btn"
                                onClick={handleAvatarDelete}
                                disabled={avatarUploading}
                            >
                                Remove photo
                            </button>
                        )}
                    </div>
                </div>

                {/* Alerts */}
                {success && <div className="profile-success">{success}</div>}
                {error && <div className="profile-error">{error}</div>}

                {/* Form */}
                <div className="profile-section">

                    <div className="profile-row">
                        <div className="profile-group">
                            <label>First Name</label>
                            <input
                                value={form.firstname}
                                onChange={e => set("firstname", e.target.value)}
                                placeholder="John"
                            />
                        </div>
                        <div className="profile-group">
                            <label>Last Name</label>
                            <input
                                value={form.lastname}
                                onChange={e => set("lastname", e.target.value)}
                                placeholder="Doe"
                            />
                        </div>
                    </div>

                    <div className="profile-row">
                        <div className="profile-group">
                            <label>Email</label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={e => set("email", e.target.value)}
                                placeholder="john@example.com"
                            />
                        </div>
                        <div className="profile-group">
                            <label>Phone</label>
                            <input
                                value={form.phone}
                                onChange={e => set("phone", e.target.value)}
                                placeholder="+216 XX XXX XXX"
                            />
                        </div>
                    </div>

                    <div className="profile-divider" />

                    <div className="profile-row">
                        <div className="profile-group">
                            <label>Current Password</label>
                            <input
                                type="password"
                                value={form.currentPassword}
                                onChange={e => set("currentPassword", e.target.value)}
                                placeholder="Required to change password"
                            />
                        </div>
                        <div className="profile-group">
                            <label>New Password</label>
                            <input
                                type="password"
                                value={form.newPassword}
                                onChange={e => set("newPassword", e.target.value)}
                                placeholder="Min. 8 characters"
                            />
                        </div>
                    </div>

                    <button
                        className="profile-save"
                        onClick={handleSubmit}
                        disabled={saving}
                    >
                        {saving ? "Saving…" : "Save Changes"}
                    </button>
                </div>

            </div>
        </div>
    );
}