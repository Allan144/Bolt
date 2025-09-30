import React, { useState, useEffect } from 'react';
import { supabase, AuthUser } from '../lib/supabase';
import { Trash2, Shield, Users, AlertTriangle, X } from 'lucide-react';

interface AdminPanelProps {
  currentUser: AuthUser;
  onClose: () => void;
}

interface UserWithStats {
  id: string;
  username: string;
  full_name: string;
  created_at: string;
  prescription_count: number;
  last_login: string | null;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser, onClose }) => {
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Get all users with prescription counts
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select(`
          id,
          username,
          full_name,
          created_at,
          prescriptions!inner(id)
        `);

      if (usersError) throw usersError;

      // Transform data to include prescription counts
      const usersWithStats: UserWithStats[] = usersData.map(user => ({
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        created_at: user.created_at,
        prescription_count: user.prescriptions?.length || 0,
        last_login: null // We don't track this currently
      }));

      setUsers(usersWithStats);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (userId === currentUser.id) {
      alert("You cannot delete your own account from the admin panel.");
      return;
    }

    setDeleting(userId);
    
    try {
      // Delete from custom users table (this will cascade to prescriptions, schedules, and logs)
      // Note: This leaves the Supabase Auth user intact, but removes all app data
      const { error: userError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (userError) throw userError;

      // Refresh the users list
      await fetchUsers();
      setConfirmDelete(null);
      
      alert(`User "${username}" has been successfully deleted along with all their app data.`);
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(`Failed to delete user "${username}". Please try again.`);
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-orange-50">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Admin Panel</h2>
              <p className="text-sm text-gray-600">User Management & System Administration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Warning Banner */}
        <div className="p-4 bg-red-50 border-b border-red-200">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div className="text-sm text-red-800">
              <strong>Warning:</strong> Deleting users will permanently remove all their prescriptions, schedules, and medication logs. This action cannot be undone.
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                All Users ({users.length})
              </h3>
            </div>
          </div>

          {users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No users found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className={`p-4 border rounded-xl transition-all ${
                    user.id === currentUser.id
                      ? 'border-blue-200 bg-blue-50'
                      : 'border-gray-200 bg-white hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold text-gray-900">
                          @{user.username}
                          {user.id === currentUser.id && (
                            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              You
                            </span>
                          )}
                        </h4>
                        {user.full_name && (
                          <span className="text-gray-600">({user.full_name})</span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Created:</span>
                          <br />
                          {formatDate(user.created_at)}
                        </div>
                        <div>
                          <span className="font-medium">Prescriptions:</span>
                          <br />
                          {user.prescription_count}
                        </div>
                        <div>
                          <span className="font-medium">User ID:</span>
                          <br />
                          <code className="text-xs bg-gray-100 px-1 rounded">
                            {user.id.substring(0, 8)}...
                          </code>
                        </div>
                      </div>
                    </div>

                    {user.id !== currentUser.id && (
                      <div className="ml-4">
                        {confirmDelete === user.id ? (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleDeleteUser(user.id, user.username)}
                              disabled={deleting === user.id}
                              className="px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {deleting === user.id ? 'Deleting...' : 'Confirm'}
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="px-3 py-2 bg-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-400"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(user.id)}
                            className="flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="text-sm">Delete</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Logged in as admin: <strong>@{currentUser.username}</strong>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close Admin Panel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};