import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import ConfirmDialog from '../components/UI/ConfirmDialog';
import { couponService } from '../services/couponService';

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      code: '',
      discountAmount: '',
      minNights: 1,
      isActive: true,
    },
  });

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    setIsLoading(true);
    try {
      const response = await couponService.getAll();
      if (response.success && response.data) {
        setCoupons(response.data);
      } else {
        toast.error(response.message || 'Failed to load coupons');
      }
    } catch {
      toast.error('Failed to load coupons');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingCoupon(null);
    reset({
      code: '',
      discountAmount: '',
      minNights: 1,
      isActive: true,
      isVisible: true,
    });
    setShowForm(true);
  };

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setValue('code', coupon.code);
    setValue('discountAmount', coupon.discountAmount); 
    setValue('minNights', coupon.minNights);
    setValue('isActive', coupon.isActive);
    setValue('isVisible', coupon.isVisible);
    setShowForm(true);
  };

  const handleDelete = (coupon) => {
    setCouponToDelete(coupon);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!couponToDelete) return;
    setIsDeleting(true);
    try {
      const response = await couponService.delete(couponToDelete.id);
      if (response.success) {
        toast.success('Coupon deleted successfully');
        setCoupons((prev) => prev.filter((item) => item.id !== couponToDelete.id));
      } else {
        toast.error(response.message || 'Failed to delete coupon');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to delete coupon');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setCouponToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setCouponToDelete(null);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const payload = {
        code: data.code.trim().toUpperCase(),
        discountAmount: Number(data.discountAmount),
        minNights: Number(data.minNights),
        isActive: data.isActive,
        isVisible: data.isVisible,
      };

      const response = editingCoupon
        ? await couponService.update(editingCoupon.id, { ...payload, id: editingCoupon.id })
        : await couponService.create(payload);

      if (response.success) {
        toast.success(editingCoupon ? 'Coupon updated successfully' : 'Coupon created successfully');
        setShowForm(false);
        setEditingCoupon(null);
        reset();
        await loadCoupons();
      } else {
        toast.error(response.message || 'Failed to save coupon');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to save coupon');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-3 border-[var(--color-sand)] border-t-[var(--color-forest)] rounded-full animate-spin mb-4" />
        <p className="text-white/50">Loading coupons...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-semibold text-white mb-1">Coupon Management</h1>
            <p className="text-white/50">Create and manage booking discounts</p>
          </div>
          <button onClick={handleAdd} className="btn-primary self-start md:self-auto">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Coupon
          </button>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="card-flat rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 md:p-8">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="font-display text-2xl font-semibold text-white">
                    {editingCoupon ? 'Edit Coupon' : 'Create Coupon'}
                  </h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[var(--color-sand)] dark:hover:bg-[#333] transition-colors"
                  >
                    <svg className="w-5 h-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div>
                    <label className="form-label">Coupon Code</label>
                    <input
                      type="text"
                      {...register('code', {
                        required: 'Coupon code is required',
                        maxLength: { value: 50, message: 'Coupon code cannot exceed 50 characters' },
                        pattern: { value: /^[A-Za-z0-9_-]+$/, message: 'Use letters, numbers, hyphens, or underscores only' },
                      })}
                      className="input-field uppercase"
                      placeholder="SAVE500"
                    />
                    {errors.code && <p className="form-error">{errors.code.message}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="form-label">Discount Amount (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        {...register('discountAmount', {
                          required: 'Discount amount is required',
                          min: { value: 1, message: 'Discount must be greater than 0' },
                        })}
                        className="input-field"
                        placeholder="500"
                      />
                      {errors.discountAmount && <p className="form-error">{errors.discountAmount.message}</p>}
                    </div>
                    <div>
                      <label className="form-label">Minimum Nights</label>
                      <input
                        type="number"
                        {...register('minNights', {
                          required: 'Minimum nights is required',
                          min: { value: 1, message: 'Minimum nights must be at least 1' },
                          max: { value: 30, message: 'Minimum nights cannot exceed 30' },
                        })}
                        className="input-field"
                        placeholder="2"
                      />
                      {errors.minNights && <p className="form-error">{errors.minNights.message}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 py-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      {...register('isActive')}
                      className="w-5 h-5 rounded border-[var(--color-sand-dark)] text-[var(--color-forest)] focus:ring-[var(--color-forest)]"
                    />
                    <label htmlFor="isActive" className="text-white/70 cursor-pointer">
                      Active and available for bookings
                    </label>
                  </div>

                  <div className="flex items-center gap-3 py-2">
                    <input
                      type="checkbox"
                      id="isVisible"
                      {...register('isVisible')}
                      className="w-5 h-5 rounded border-[var(--color-sand-dark)] text-[var(--color-forest)] focus:ring-[var(--color-forest)]"
                    />
                    <label htmlFor="isVisible" className="text-white/70 cursor-pointer">
                      Visible to users (show in coupon list)
                    </label>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setShowForm(false)} className="flex-1 btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" disabled={isSubmitting} className="flex-1 btn-primary disabled:opacity-50">
                      {isSubmitting ? 'Saving...' : editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        <div className="card-flat rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--color-sand)]/50 dark:bg-[#333]">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/50 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/50 uppercase tracking-wider">Discount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/50 uppercase tracking-wider">Min Stay</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/50 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/50 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-white/50 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-sand)] dark:divide-[#3D3D3D]">
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-[var(--color-sand)]/30 dark:hover:bg-[#333] transition-colors">
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-[var(--color-sand)]/50 dark:bg-[#333] text-white font-mono text-sm tracking-wider">
                        {coupon.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[var(--color-forest)] dark:text-emerald-400 font-semibold">
                      ₹{Number(coupon.discountAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-white/60">{coupon.minNights} night{coupon.minNights > 1 ? 's' : ''}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                        coupon.isActive
                          ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                          : 'bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${coupon.isActive ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                        {coupon.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white/60">{new Date(coupon.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(coupon)}
                          className="p-2 rounded-lg hover:bg-[var(--color-sand)] dark:hover:bg-[#404040] text-white/60 hover:text-white transition-colors"
                          title="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(coupon)}
                          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/20 text-white/60 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {coupons.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-sand)] dark:bg-[#333] flex items-center justify-center">
                <svg className="w-8 h-8 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l2-2 4 4m5-5a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-white/50 mb-4">No coupons found</p>
              <button onClick={handleAdd} className="btn-primary">Create Your First Coupon</button>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title={couponToDelete ? `Delete ${couponToDelete.code}?` : 'Delete Coupon?'}
        message="This coupon will no longer be available for new bookings. Existing bookings will keep their discount details."
        confirmLabel="Delete Coupon"
        cancelLabel="Keep Coupon"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isDangerous={true}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default AdminCoupons;
