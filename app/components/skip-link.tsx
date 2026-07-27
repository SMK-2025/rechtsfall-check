"use client";

export function SkipLink(){
  function moveToContent(event: React.MouseEvent<HTMLAnchorElement>){
    const main = document.querySelector<HTMLElement>("main");
    if (!main) return;
    event.preventDefault();
    if (!main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1");
    main.focus();
    main.scrollIntoView({ block: "start" });
  }

  return <a className="skip-link" href="#main-content" onClick={moveToContent}>Direkt zum Inhalt</a>;
}
