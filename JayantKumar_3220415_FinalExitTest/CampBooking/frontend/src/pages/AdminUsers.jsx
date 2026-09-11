import { useEffect, useState } from 'react';
import ConfirmDialog from '../components/UI/ConfirmDialog';
import { toast } from 'react-toastify';
import { authService } from '../services/authService';
import { bookingService } from '../services/bookingService';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userBookings, setUserBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const response = await authService.getAllUsers();
      if (response.success && response.data) {
        setUsers(response.data);
      } else {
        toast.error(response.message || 'Failed to load users');
      }
    } catch {
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleViewUser = async (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
    setLoadingBookings(true);
    try {
      const response = await bookingService.getUserBookingsAdmin(user.id);
      if (response.success && response.data) {
        setUserBookings(response.data);
      } else {
        setUserBookings([]);
      }
    } catch {
      setUserBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  const handleDeleteUser = (user) => {
    if (user.isAdmin) {
      toast.error('Cannot delete admin users');
      return;
    }
    setUserToDelete(user);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    setDeletingUserId(userToDelete.id);
    try {
      const response = await authService.deleteUser(userToDelete.id);
      if (response.success) {
        setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
        toast.success('User deleted successfully');
      } else {
        toast.error(response.message || 'Failed to delete user');
      }
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to delete user';
      toast.error(message);
    } finally {
      setDeletingUserId(null);
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    }
  };

  const handleCancelDeleteUser = () => {
    setShowDeleteConfirm(false);
    setUserToDelete(null);
  };

  const isCampStarted = (checkInDate) => {
    if (!checkInDate) return false;
    const datePart = String(checkInDate).split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    if (!year || !month || !day) return false;
    // Check-in starts at 12:00 PM (noon)
    const checkInStart = new Date(year, month - 1, day, 12, 0, 0);
    return new Date() >= checkInStart;
  };

  const handleCancelBooking = async (bookingRef) => {
    try {
      const response = await bookingService.cancel(bookingRef);
      if (response.success) {
        toast.success('Booking cancelled successfully. Slot released and refund initiated.');
        setUserBookings((prev) =>
          prev.map((b) => (b.bookingReference === bookingRef ? { ...b, status: 'Cancelled' } : b))
        );
      } else {
        toast.error(response.message || 'Failed to cancel booking');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const closeModal = () => {
    setShowUserModal(false);
    setSelectedUser(null);
    setUserBookings([]);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-3 border-[var(--color-sand)] border-t-[var(--color-forest)] rounded-full animate-spin mb-4" />
        <p className="text-white/50">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-semibold text-white mb-1">User Management</h1>
            <p className="text-white/50">Manage user roles and permissions</p>
          </div>
          <button onClick={loadUsers} className="btn-secondary text-sm self-start md:self-auto">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Table */}
        <div className="card-flat rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--color-sand)]/50 dark:bg-[#333]">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/50 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/50 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/50 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/50 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-white/50 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-sand)] dark:divide-[#3D3D3D]">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-[var(--color-sand)]/30 dark:hover:bg-[#333] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-sm font-semibold">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </div>
                        <span className="font-medium text-white">{user.firstName} {user.lastName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white/60">{user.email}</td>
                    <td className="px-6 py-4 text-white/60">{new Date(user.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                        user.isAdmin
                          ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300'
                          : 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.isAdmin ? 'bg-purple-500' : 'bg-emerald-500'}`}></span>
                        {user.isAdmin ? 'Admin' : 'Member'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewUser(user)}
                          className="p-2 rounded-lg hover:bg-[var(--color-sand)] dark:hover:bg-[#404040] text-white/60 hover:text-white transition-colors"
                          title="View Details"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        {!user.isAdmin && (
                          <button
                            onClick={() => handleDeleteUser(user)}
                            disabled={deletingUserId === user.id}
                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/20 text-white/60 hover:text-red-500 transition-colors disabled:opacity-50"
                            title="Delete User"
                          >
                            {deletingUserId === user.id ? (
                              <div className="w-5 h-5 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" />
                            ) : (
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-sand)] dark:bg-[#333] flex items-center justify-center">
                <svg className="w-8 h-8 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-white/50">No users found</p>
            </div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          title={userToDelete ? `Delete ${userToDelete.firstName} ${userToDelete.lastName}?` : 'Delete User?'}
          message="This action cannot be undone. All bookings for this user will also be removed."
          confirmLabel="Delete User"
          cancelLabel="Cancel"
          onConfirm={handleConfirmDeleteUser}
          onCancel={handleCancelDeleteUser}
          isDangerous={true}
          isLoading={!!deletingUserId}
        />

        {/* User Details Modal */}
        {showUserModal && selectedUser && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="card-flat rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fadeIn">
              <div className="p-6 md:p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xl font-bold">
                      {selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}
                    </div>
                    <div>
                      <h2 className="font-display text-2xl font-semibold text-white">
                        {selectedUser.firstName} {selectedUser.lastName}
                      </h2>
                      <p className="text-white/50">{selectedUser.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={closeModal}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[var(--color-sand)] dark:hover:bg-[#333] transition-colors"
                  >
                    <svg className="w-5 h-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* User Info */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="glass rounded-xl p-4">
                    <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Role</p>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                      selectedUser.isAdmin
                        ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300'
                        : 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${selectedUser.isAdmin ? 'bg-purple-500' : 'bg-emerald-500'}`}></span>
                      {selectedUser.isAdmin ? 'Admin' : 'Member'}
                    </span>
                  </div>
                  <div className="glass rounded-xl p-4">
                    <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Member Since</p>
                    <p className="text-white font-medium">{new Date(selectedUser.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                  {selectedUser.dateOfBirth && (
                    <div className="glass rounded-xl p-4">
                      <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Date of Birth</p>
                      <p className="text-white font-medium">{new Date(selectedUser.dateOfBirth).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                  )}
                </div>

                {/* User Bookings */}
                <div>
                  <h3 className="font-display text-lg font-semibold text-white mb-4">Bookings</h3>
                  {loadingBookings ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-8 h-8 border-2 border-[var(--color-sand)] border-t-[var(--color-forest)] rounded-full animate-spin" />
                    </div>
                  ) : userBookings.length === 0 ? (
                    <div className="text-center py-8 glass rounded-xl">
                      <p className="text-white/50">No bookings found for this user</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {userBookings.map((booking) => (
                        <div key={booking.id} className="glass rounded-xl p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-white">{booking.campName}</p>
                              <p className="text-sm text-white/50">{booking.campLocation}</p>
                              <p className="text-xs text-white/40 mt-1">
                                {new Date(booking.checkInDate).toLocaleDateString('en-IN')} - {new Date(booking.checkOutDate).toLocaleDateString('en-IN')}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                                booking.status === 'Confirmed'
                                  ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                                  : 'bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                              }`}>
                                {booking.status}
                              </span>
                              <p className="text-white font-semibold mt-1">₹{Number(booking.totalAmount || 0).toLocaleString('en-IN')}</p>
                              {booking.status === 'Confirmed' && !isCampStarted(booking.checkInDate) && (
                                <button
                                  onClick={() => handleCancelBooking(booking.bookingReference)}
                                  className="mt-2 text-xs text-red-400 hover:text-red-300 underline block ml-auto"
                                >
                                  Cancel & Release Slot
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
