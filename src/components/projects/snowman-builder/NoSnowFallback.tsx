export default function NoSnowFallback() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "350px",
        gap: "1.5rem",
        padding: "2rem",
      }}
    >
      <img
        src="/images/projects/snowmanpuddle.png"
        alt="A melted snowman puddle"
        style={{
          width: "100%",
          maxWidth: "380px",
          height: "auto",
        }}
      />
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.25rem",
          color: "var(--color-text)",
          textAlign: "center",
        }}
      >
        No snow here today!
      </div>
      <div
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.875rem",
          color: "var(--color-muted)",
          textAlign: "center",
        }}
      >
        Try searching for a snowy city to build your snowman.
      </div>
    </div>
  );
}
