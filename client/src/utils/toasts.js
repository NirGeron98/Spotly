import { toast } from "react-toastify";

const commonStyle = {
  fontSize: "1.2rem",
  padding: "24px 28px",
  minHeight: "90px",
  borderRadius: "16px",
  direction: "rtl",
  textAlign: "right",
  fontWeight: "600",
};

const toastOptions = {
  position: "top-center",
  autoClose: 4500,
  style: commonStyle,
};

export const notifySuccess = (msg) => toast.success(msg, toastOptions);
export const notifyError = (msg) => toast.error(msg, toastOptions);
export const notifyInfo = (msg) => toast.info(msg, toastOptions);
