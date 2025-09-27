import { useState, useEffect } from "preact/hooks";

interface User {
  id: string;
  email: string;
  displayName: string;
  username: string;
  schoolId: string | null;
  schoolName?: string;
  role: "teacher" | "delegate" | "school_admin" | "super_admin";
  verified: boolean;
  createdAt: string;
}

interface School {
  id: string;
  name: string;
  slug: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState<string>("");
  const [editSchoolId, setEditSchoolId] = useState<string>("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    displayName: "",
    password: "",
    role: "teacher",
    schoolId: "",
    username: "",
  });

  async function loadData() {
    try {
      const [usersRes, schoolsRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/schools"),
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }

      if (schoolsRes.ok) {
        const schoolsData = await schoolsRes.json();
        setSchools(schoolsData);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function startEdit(user: User) {
    setEditingUser(user);
    setEditRole(user.role);
    setEditSchoolId(user.schoolId || "");
    setMessage("");
  }

  function cancelEdit() {
    setEditingUser(null);
    setEditRole("");
    setEditSchoolId("");
    setMessage("");
  }

  async function saveEdit() {
    if (!editingUser) return;

    try {
      const updates: any = {};
      if (editRole !== editingUser.role) {
        updates.role = editRole;
      }
      if (editSchoolId !== (editingUser.schoolId || "")) {
        updates.schoolId = editSchoolId || null;
      }

      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: editingUser.id, updates }),
      });

      if (response.ok) {
        setMessage("✓ User updated successfully");
        await loadData();
        cancelEdit();
      } else {
        const data = await response.json();
        setMessage(`✗ ${data.error}`);
      }
    } catch (error) {
      setMessage("✗ Failed to update user");
    }
  }

  async function createNewUser(e: Event) {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      if (response.ok) {
        setMessage("✓ User created successfully");
        await loadData();
        setShowCreateForm(false);
        setNewUser({
          email: "",
          displayName: "",
          password: "",
          role: "teacher",
          schoolId: "",
          username: "",
        });
      } else {
        const data = await response.json();
        setMessage(`✗ ${data.error}`);
      }
    } catch (error) {
      setMessage("✗ Failed to create user");
    }
  }

  async function deleteUser(userId: string, displayName: string) {
    if (!confirm(`Are you sure you want to delete "${displayName}"? This cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setUsers(users.filter((u) => u.id !== userId));
        setMessage("✓ User deleted successfully");
      } else {
        const data = await response.json();
        setMessage(`✗ ${data.error}`);
      }
    } catch (error) {
      setMessage("✗ Failed to delete user");
    }
  }

  const filteredUsers = users.filter((user) => {
    if (filter === "all") return true;
    return user.role === filter;
  });

  if (loading) {
    return (
      <div class="text-center py-12">
        <div class="text-2xl">Loading users...</div>
      </div>
    );
  }

  return (
    <div class="space-y-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">Filters</h2>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            class="px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white font-semibold transition-all"
          >
            {showCreateForm ? "Cancel" : "+ Create User"}
          </button>
        </div>

        {showCreateForm && (
          <form onSubmit={createNewUser} class="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onInput={(e) => setNewUser({ ...newUser, email: (e.target as HTMLInputElement).value })}
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Display Name *
                </label>
                <input
                  type="text"
                  value={newUser.displayName}
                  onInput={(e) => setNewUser({ ...newUser, displayName: (e.target as HTMLInputElement).value })}
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onInput={(e) => setNewUser({ ...newUser, password: (e.target as HTMLInputElement).value })}
                  required
                  minLength={8}
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role *
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: (e.target as HTMLSelectElement).value })}
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-800 dark:text-white"
                >
                  <option value="teacher">Teacher</option>
                  <option value="delegate">Delegate</option>
                  <option value="school_admin">School Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  School
                </label>
                <select
                  value={newUser.schoolId}
                  onChange={(e) => setNewUser({ ...newUser, schoolId: (e.target as HTMLSelectElement).value })}
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-800 dark:text-white"
                >
                  <option value="">No school</option>
                  {schools.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={newUser.username}
                  onInput={(e) => setNewUser({ ...newUser, username: (e.target as HTMLInputElement).value })}
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
            <button
              type="submit"
              class="w-full px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition-all"
            >
              Create User
            </button>
          </form>
        )}

      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div class="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            class={`px-4 py-2 rounded-lg font-semibold ${
              filter === "all"
                ? "bg-primary text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            All ({users.length})
          </button>
          <button
            onClick={() => setFilter("teacher")}
            class={`px-4 py-2 rounded-lg font-semibold ${
              filter === "teacher"
                ? "bg-primary text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            Teachers ({users.filter((u) => u.role === "teacher").length})
          </button>
          <button
            onClick={() => setFilter("delegate")}
            class={`px-4 py-2 rounded-lg font-semibold ${
              filter === "delegate"
                ? "bg-primary text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            Delegates ({users.filter((u) => u.role === "delegate").length})
          </button>
          <button
            onClick={() => setFilter("school_admin")}
            class={`px-4 py-2 rounded-lg font-semibold ${
              filter === "school_admin"
                ? "bg-primary text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            School Admins ({users.filter((u) => u.role === "school_admin").length})
          </button>
          <button
            onClick={() => setFilter("super_admin")}
            class={`px-4 py-2 rounded-lg font-semibold ${
              filter === "super_admin"
                ? "bg-primary text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            Super Admins ({users.filter((u) => u.role === "super_admin").length})
          </button>
        </div>
        {message && (
          <p class={`mt-4 text-sm ${message.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>
            {message}
          </p>
        )}
      </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">
            {filter === "all" ? "All Users" : `${filter.replace("_", " ")} Users`} ({filteredUsers.length})
          </h2>
        </div>
        {filteredUsers.length === 0 ? (
          <div class="p-12 text-center text-gray-500 dark:text-gray-400">
            No users found
          </div>
        ) : (
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    Name
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    Email
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    Role
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    School
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    Username
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map((user) => (
                  <tr key={user.id} class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td class="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {user.displayName}
                      {!user.verified && (
                        <span class="ml-2 text-xs text-yellow-600 dark:text-yellow-400">(unverified)</span>
                      )}
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {user.email}
                    </td>
                    <td class="px-6 py-4 text-sm">
                      {editingUser?.id === user.id ? (
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole((e.target as HTMLSelectElement).value)}
                          class="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white text-sm"
                        >
                          <option value="teacher">teacher</option>
                          <option value="delegate">delegate</option>
                          <option value="school_admin">school_admin</option>
                          <option value="super_admin">super_admin</option>
                        </select>
                      ) : (
                        <span class="text-gray-900 dark:text-white">{user.role}</span>
                      )}
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {editingUser?.id === user.id ? (
                        <select
                          value={editSchoolId}
                          onChange={(e) => setEditSchoolId((e.target as HTMLSelectElement).value)}
                          class="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white text-sm"
                        >
                          <option value="">No school</option>
                          {schools.map((school) => (
                            <option key={school.id} value={school.id}>
                              {school.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span>{user.schoolName || "-"}</span>
                      )}
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 font-mono">
                      {user.username || "-"}
                    </td>
                    <td class="px-6 py-4 text-sm text-right">
                      {editingUser?.id === user.id ? (
                        <div class="flex gap-2 justify-end">
                          <button
                            onClick={saveEdit}
                            class="text-green-600 hover:text-green-800 dark:text-green-400 font-semibold"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            class="text-gray-600 hover:text-gray-800 dark:text-gray-400 font-semibold"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div class="flex gap-3 justify-end">
                          <button
                            onClick={() => startEdit(user)}
                            class="text-primary hover:text-primary-dark dark:text-primary-light font-semibold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteUser(user.id, user.displayName)}
                            class="text-red-600 hover:text-red-800 dark:text-red-400 font-semibold"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}