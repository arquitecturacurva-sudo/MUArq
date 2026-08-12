import { useEffect, useRef, useState } from "react";
import { SANS, SERIF } from "./landingTheme";
import cityPoster from "../../assets/landing/city-poster.jpg";
import iconExcel from "../../assets/landing/icon-excel.png";
import iconWhatsapp from "../../assets/landing/icon-whatsapp.png";
import iconPdf from "../../assets/landing/icon-pdf.png";
import iconCalendar from "../../assets/landing/icon-calendar.png";

/** Served from public/ so the 11MB file is never inlined into standalone.html. */
const VIDEO_SRC = `${import.meta.env.BASE_URL}web-background.mp4`;

/** Same four pain points the landing already sells against, one icon each. */
const PROBLEM_CARDS = [
  {
    id: "excel",
    icon: iconExcel,
    title: "Excel para honorarios y cotizaciones",
    detail: "Cada proyecto arma su propia fórmula y nadie sabe cuál versión se envió al cliente.",
  },
  {
    id: "whatsapp",
    icon: iconWhatsapp,
    title: "WhatsApp para acuerdos importantes",
    detail: "Los cambios se aprueban en un chat y desaparecen entre mensajes cuando hay que cobrarlos.",
  },
  {
    id: "pdf",
    icon: iconPdf,
    title: "PDFs sueltos para propuestas y cambios",
    detail: "Cada revisión genera un archivo nuevo y el alcance real deja de ser evidente.",
  },
  {
    id: "cronograma",
    icon: iconCalendar,
    title: "Cronogramas que no conversan con cobros",
    detail: "El avance de obra no se refleja en la valorización ni en la siguiente factura.",
  },
] as const;

export default function LandingProblems() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [videoFailed, setVideoFailed] = useState(false);

  // Only fetch and play the background while the section is on screen.
  useEffect(() => {
    const video = videoRef.current;
    const section = sectionRef.current;
    if (!video || !section) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!video.src) video.src = VIDEO_SRC;
          void video.play().catch(() => undefined);
        } else {
          video.pause();
        }
      },
      {rootMargin: "200px"}
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="curv-problemas"
      data-curv-problems-v2
      style={{
        position: "relative",
        overflow: "hidden",
        background: "#05070A",
        color: "#FFFFFF",
        isolation: "isolate",
      }}
    >
      <style>{`
        [data-curv-problems-v2] [data-problem-grid] {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }
        @media (max-width: 1080px) {
          [data-curv-problems-v2] [data-problem-grid] { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 640px) {
          [data-curv-problems-v2] [data-problem-grid] { grid-template-columns: 1fr; }
        }
      `}</style>

      {!videoFailed && (
        <video
          ref={videoRef}
          poster={cityPoster}
          muted
          loop
          playsInline
          preload="none"
          aria-hidden
          onError={() => setVideoFailed(true)}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            zIndex: -2,
          }}
        />
      )}

      {/* Scrim: blends into the black hero above and keeps the copy legible. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          zIndex: -1,
          background: [
            "linear-gradient(180deg, #000000 0%, rgba(5,7,10,0.70) 11%, rgba(5,7,10,0.34) 42%, rgba(5,7,10,0.48) 78%, rgba(5,7,10,0.90) 100%)",
            "radial-gradient(78% 56% at 46% 44%, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.34) 100%)",
          ].join(", "),
        }}
      />

      <div style={{maxWidth: 1340, margin: "0 auto", padding: "clamp(72px, 9vw, 132px) 32px"}}>
        <div style={{maxWidth: 760, marginBottom: "clamp(40px, 5vw, 64px)"}}>
          <div
            style={{
              fontFamily: SANS,
              fontWeight: 400,
              fontSize: 12,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.62)",
              marginBottom: 18,
            }}
          >
            El problema
          </div>
          <h2
            style={{
              margin: 0,
              fontFamily: SERIF,
              fontWeight: 400,
              fontSize: "clamp(26px, 3.6vw, 42px)",
              lineHeight: 1.22,
              letterSpacing: "-0.01em",
            }}
          >
            La operación se pierde entre archivos que{" "}
            <em style={{fontStyle: "italic"}}>no conversan</em>.
          </h2>
          <p
            style={{
              margin: "20px 0 0",
              fontFamily: SANS,
              fontWeight: 200,
              fontSize: "clamp(15px, 1.4vw, 18px)",
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.74)",
            }}
          >
            Cada documento nace de la misma ficha y cada herramienta deja una pista útil para la
            siguiente decisión.
          </p>
        </div>

        <div data-problem-grid style={{display: "grid", gap: 18}}>
          {PROBLEM_CARDS.map((card) => (
            <article
              key={card.id}
              style={{
                border: "1px solid rgba(255,255,255,0.16)",
                borderRadius: 14,
                background: "rgba(10,13,18,0.52)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                padding: "26px 22px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <img
                src={card.icon}
                alt=""
                aria-hidden
                style={{width: 52, height: 52, objectFit: "contain"}}
              />
              <h3
                style={{
                  margin: 0,
                  fontFamily: SANS,
                  fontWeight: 400,
                  fontSize: 17,
                  lineHeight: 1.35,
                  color: "#FFFFFF",
                }}
              >
                {card.title}
              </h3>
              <p
                style={{
                  margin: 0,
                  fontFamily: SANS,
                  fontWeight: 200,
                  fontSize: 14,
                  lineHeight: 1.65,
                  color: "rgba(255,255,255,0.68)",
                }}
              >
                {card.detail}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
