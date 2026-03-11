// Векторный логотип L·KOMAND по дизайну из Figma
// Используется в Header и Footer

export default function Logo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="130"
      height="28"
      viewBox="0 0 130 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="L-Komand"
    >
      {/* L */}
      <text
        x="0" y="22"
        fontFamily="'Manrope', sans-serif"
        fontWeight="700"
        fontSize="22"
        fill="white"
        letterSpacing="-0.5"
      >
        L·KOMAND
      </text>
    </svg>
  );
}

/*
  TODO: Замени этот компонент на настоящий SVG логотип.
  Экспортируй лого из Figma: выдели фрейм "L-Komand" (node 18:232)
  → правая кнопка → Copy as SVG → вставь сюда содержимое <svg>.

  Пример:
  export default function Logo({ className }: { className?: string }) {
    return (
      <svg className={className} width="130" height="28" viewBox="..." fill="none">
        <path d="M..." fill="white"/>
      </svg>
    );
  }
*/
