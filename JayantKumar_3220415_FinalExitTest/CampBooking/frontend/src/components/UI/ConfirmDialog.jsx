const ConfirmDialog = ({
  isOpen,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isDangerous = true,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="animate-fadeIn w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className={`p-6 text-center border-b ${
          isDangerous
            ? 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20'
            : 'bg-[var(--color-sand)]/40 dark:bg-gray-700/40 border-[var(--color-sand)] dark:border-gray-700'
        }`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            isDangerous
              ? 'bg-red-100 dark:bg-red-500/20'
              : 'bg-[var(--color-sand)] dark:bg-gray-700'
          }`}>
            {isDangerous ? (
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-[var(--color-forest)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <h3 className="font-display text-xl font-semibold text-[var(--color-charcoal)] dark:text-white mb-2">{title}</h3>
          {message && (
            <p className="text-[var(--color-bark)] dark:text-gray-400 font-body text-sm">{message}</p>
          )}
        </div>

        {/* Actions */}
        <div className="p-6">
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 py-3 bg-[var(--color-sand)] dark:bg-gray-700 hover:bg-[var(--color-sand)]/80 dark:hover:bg-gray-600 rounded-xl text-[var(--color-charcoal)] dark:text-white font-medium transition-colors disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 py-3 rounded-xl text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
                isDangerous
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-[var(--color-forest)] hover:bg-[var(--color-forest-dark)]'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                confirmLabel
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
