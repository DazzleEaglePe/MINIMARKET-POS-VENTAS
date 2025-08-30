import Swal from "sweetalert2";

export const createCancelledError = () => {
  const err = new Error("cancelled");
  err.name = "ConfirmCancelled";
  err.isCancelled = true;
  return err;
};

export const isCancelledError = (err) => !!(err && (err.isCancelled || err?.name === "ConfirmCancelled"));

// Simple confirm helper. Returns true if confirmed.
export async function confirm(options = {}) {
  const {
    title = "¿Confirmar acción?",
    text = "Esta acción no se puede deshacer.",
    icon,
    confirmButtonText = "Sí, continuar",
    cancelButtonText = "Cancelar",
    confirmButtonColor = "#3085d6",
    cancelButtonColor = "#d33",
    variant, // 'danger' | undefined
    customClass,
    ...rest
  } = options;

  const computedIcon = icon ?? (variant === "danger" ? "warning" : undefined);
  const computedCustomClass = {
    ...(customClass || {}),
    confirmButton: [
      customClass?.confirmButton,
      variant === "danger" ? "swal2-danger" : undefined,
    ]
      .filter(Boolean)
      .join(" "),
  };

  const result = await Swal.fire({
    title,
    text,
    icon: computedIcon,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    confirmButtonColor,
    cancelButtonColor,
    reverseButtons: true,
    focusCancel: true,
    customClass: computedCustomClass,
    ...rest,
  });
  return result.isConfirmed === true;
}

// Confirm and then run provided async function.
export async function confirmAndRun(fn, options) {
  const ok = await confirm(options);
  if (!ok) throw createCancelledError();
  return await fn();
}
