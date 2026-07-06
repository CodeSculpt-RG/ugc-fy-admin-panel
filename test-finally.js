async function refreshAdmin() {
  try {
    try {
      throw new DOMException("Abort", "AbortError");
    } catch (fetchErr) {
      if (fetchErr.name === "AbortError") {
        console.log("inner abort, returning");
        return;
      }
    }
  } catch (err) {
    console.log("outer catch");
  } finally {
    console.log("outer finally");
  }
}
refreshAdmin();
