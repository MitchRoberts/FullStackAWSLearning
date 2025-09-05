import { useMemo, useRef } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";

const STEPS = [
  { title: "Clip Links Instantly", body: "Paste any URL and it’s saved with title, icon, and tags.", align: "left"  as const },
  { title: "Stay Organized",       body: "Filter by tags, search by title or URL, and sort by recency.", align: "right" as const },
  { title: "Share Selectively",    body: "Keep your vault private by default. Share only what you choose.", align: "left"  as const },
];

const IMAGE_SRC =
  "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=1600&auto=format&fit=crop";

export default function ScrollHero() {
  const sectionRef = useRef<HTMLDivElement | null>(null);

  // Progress 0→1 across the whole section
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const p = useSpring(scrollYProgress, { stiffness: 120, damping: 20, mass: 0.25 });

  // Image slide track: center -> left/right -> left/right...
  const alignSeq = ["center" as const, ...STEPS.map(s => s.align), "center" as const];
  const input = useMemo(() => alignSeq.map((_, i) => i / (alignSeq.length - 1)), []);
  const imageXs = useMemo(
    () => alignSeq.map(a => (a === "center" ? "0vw" : a === "left" ? "-28vw" : "28vw")),
    []
  );
  const imageX  = useTransform(p, input, imageXs);
  const rotateY = useTransform(p, [0, 1], [-14, 14]);
  const scale   = useTransform(p, [0, 1], [0.96, 1.05]);
  const y       = useTransform(p, [0, 1], [12, -12]);

  // Fade each step's text during its segment
  const textOpacities = STEPS.map((_, i) => {
    const start = i / STEPS.length;
    const mid   = (i + 0.5) / STEPS.length;
    const end   = (i + 1) / STEPS.length;
    return useTransform(p, [start, mid, end], [0, 1, 0]);
  });

  return (
    <>
      {/* SCROLL SECTION */}
      <section ref={sectionRef} className="relative h-[400vh] bg-gray-50">
        {/* Pinned stage */}
				<div className="sticky top-0 h-screen" style={{ perspective: "1200px", overflow: "visible" }}>
					{/* 3 columns on md+: [left | image | right] */}
					<div className="relative mx-auto h-full max-w-6xl px-6 grid items-center gap-8
													grid-cols-1 md:grid-cols-[1fr_minmax(0,740px)_1fr]">
						{/* LEFT TEXT (visible when align === 'right') */}
						<div className="hidden md:block pointer-events-none relative h-full">
							{STEPS.map((s, i) => (
								<motion.div
									key={`left-${i}`}
									// Absolute + flex-center vertically => always centered
									className="absolute inset-0 flex items-center"
									style={{ opacity: s.align === "right" ? textOpacities[i] : 0 }}
								>
									<div className="max-w-md md:pr-8 text-left">
										<h2 className="text-2xl md:text-4xl font-semibold">{s.title}</h2>
										<p className="mt-3 text-gray-600 md:text-lg">{s.body}</p>
									</div>
								</motion.div>
							))}
						</div>

						{/* IMAGE (center column; slides left/right) */}
						<div className="relative justify-self-center z-50 ">
							<motion.div
								className="w-[min(86vw,740px)] will-change-transform"
								style={{ x: imageX, rotateY, scale, y, transformStyle: "preserve-3d" }}
							>
								<div className="rounded-3xl border bg-white shadow-xl overflow-hidden">
									<img
										src={IMAGE_SRC}
										alt="Preview"
										className="w-full h-[52vh] md:h-[58vh] object-cover"
									/>
								</div>
							</motion.div>
						</div>

						{/* RIGHT TEXT (visible when align === 'left') */}
						<div className="hidden md:block pointer-events-none relative h-full">
							{STEPS.map((s, i) => (
								<motion.div
									key={`right-${i}`}
									className="absolute inset-0 flex items-center justify-end text-right"
									style={{ opacity: s.align === "left" ? textOpacities[i] : 0 }}
								>
									<div className="max-w-md md:pl-8">
										<h2 className="text-2xl md:text-4xl font-semibold">{s.title}</h2>
										<p className="mt-3 text-gray-600 md:text-lg">{s.body}</p>
									</div>
								</motion.div>
							))}
						</div>

						{/* MOBILE TEXT (center overlay) */}
						<div className="md:hidden pointer-events-none absolute left-6 right-6 top-1/2 -translate-y-1/2">
							{STEPS.map((s, i) => (
								<motion.div key={`m-${i}`} style={{ opacity: textOpacities[i] }}>
									<h2 className="text-2xl font-semibold">{s.title}</h2>
									<p className="mt-2 text-gray-600">{s.body}</p>
								</motion.div>
							))}
						</div>
					</div>
				</div>



        {/* Scroll spacers (one screen per step) */}
        <div className="pointer-events-none">
          {STEPS.map((_, i) => (
            <div key={i} className="h-screen" />
          ))}
        </div>
      </section>

      {/* FINAL CTA (image parked at bottom, CTA above) */}
      <section className="relative min-h-[100vh] bg-white">
        <div className="mx-auto max-w-6xl px-6 pt-16 pb-40">
          <h3 className="text-3xl md:text-5xl font-semibold">Ready to build your vault?</h3>
          <p className="mt-3 text-gray-600 md:text-lg">
            Capture links in seconds and find them in milliseconds.
          </p>
          <div className="mt-6">
            <a
              href="#"
              className="inline-flex items-center justify-center rounded-xl border px-5 py-3 bg-black text-white hover:bg-gray-900"
            >
              Join now
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
