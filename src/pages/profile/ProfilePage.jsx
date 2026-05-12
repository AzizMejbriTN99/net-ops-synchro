import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { PROFILE } from "../../services/api";
import "../css/ProfilePage.css";

export default function ProfilePage() {

    const { user, authFetch } = useAuth();

    const [form, setForm] = useState({
        email: user?.email || "",
        phone: user?.phone || "",
        currentPassword: "",
        newPassword: "",
    });

    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    const set = (k, v) =>
        setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async () => {

        setSaving(true);
        setSuccess("");
        setError("");

        try {

            const res = await authFetch(
                PROFILE.profile,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(form),
                }
            );

            setSuccess(res.message);
            setForm(f => ({
                ...f,
                currentPassword: "",
                newPassword: "",
            }));

        } catch (e) {
            setError(e.message || "Update failed");
        } finally {
            setSaving(false);

        }
    };

    return (
        <div className="profile-page">
            <div className="profile-card">
                <div className="profile-header">
                    <div>
                        <div className="profile-title">
                            Personal Profile
                        </div>

                        <div className="profile-sub">
                            Manage your account information
                        </div>
                    </div>
                </div>

                {success && (
                    <div className="profile-success">
                        {success}
                    </div>
                )}

                {error && (
                    <div className="profile-error">
                        {error}
                    </div>
                )}

                <div className="profile-section">
                    <div className="profile-group">
                        <label>First Name</label>
                        <input
                            value={user?.firstname || ""}
                            disabled
                        />
                    </div>

                    <div className="profile-group">
                        <label>Last Name</label>
                        <input
                            value={user?.lastname || ""}
                            disabled
                        />
                    </div>

                    <div className="profile-group">
                        <label>Email</label>
                        <input
                            value={form.email}
                            onChange={e => set("email", e.target.value)}
                        />
                    </div>

                    <div className="profile-group">
                        <label>Phone</label>
                        <input
                            value={form.phone}
                            onChange={e => set("phone", e.target.value)}
                        />
                    </div>

                    <div className="profile-divider" />

                    <div className="profile-group">
                        <label>Current Password</label>
                        <input
                            type="password"
                            value={form.currentPassword}
                            onChange={e => set("currentPassword", e.target.value)}
                        />
                    </div>

                    <div className="profile-group">
                        <label>New Password</label>
                        <input
                            type="password"
                            value={form.newPassword}
                            onChange={e => set("newPassword", e.target.value)}
                        />
                    </div>

                    <button
                        className="profile-save"
                        onClick={handleSubmit}
                        disabled={saving}
                    >
                        {saving ? "Saving..." : "Save Changes"}
                    </button>

                </div>
            </div>
        </div>
    );
}