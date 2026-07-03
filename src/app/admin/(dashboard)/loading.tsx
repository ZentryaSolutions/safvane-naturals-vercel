export default function AdminLoading() {
  return (
    <div style={{ display: "flex", minHeight: "40vh", alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          width: 32,
          height: 32,
          border: "2px solid #e4e4e7",
          borderTopColor: "#c9a227",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
