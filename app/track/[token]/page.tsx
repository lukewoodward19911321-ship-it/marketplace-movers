"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type TrackingJob = {
  customer: string;
  job_type: string;
  collection: string;
  delivery: string;
  job_date: string | null;
  job_time: string | null;
  status: string;
  live_tracking_enabled: boolean;
  driver_latitude: number | null;
  driver_longitude: number | null;
  driver_location_accuracy: number | null;
  driver_location_updated_at: string | null;
};

type JobPhotoRow = {
  id: number;
  photo_path: string;
  caption: string | null;
  photo_type: string;
  created_at: string;
};

type JobPhoto = JobPhotoRow & {
  publicUrl: string;
};

type JobSignatureRow = {
  customer_name: string | null;
  signature_path: string;
  signed_at: string;
};

type JobSignature = JobSignatureRow & {
  publicUrl: string;
};

const trackingSteps = [
  "Booked",
  "On Route",
  "In Progress",
  "Ready for Signature",
  "Completed",
];

export default function TrackingPage() {
  const params = useParams();

  const token = Array.isArray(params.token)
    ? params.token[0]
    : String(params.token || "");

  const [job, setJob] = useState<TrackingJob | null>(null);
  const [photos, setPhotos] = useState<JobPhoto[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<JobPhoto | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [signature, setSignature] = useState<JobSignature | null>(null);
  const [signatureName, setSignatureName] = useState("");
  const [signatureMessage, setSignatureMessage] = useState("");
  const [submittingSignature, setSubmittingSignature] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);

  useEffect(() => {
    async function loadTracking() {
      if (!token) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        const [trackingResult, photosResult, signatureResult] = await Promise.all([
          supabase.rpc("get_public_job_tracking", {
            p_tracking_token: token,
          }),
          supabase.rpc("get_public_job_photos", {
            p_tracking_token: token,
          }),
          supabase.rpc("get_public_job_signature", {
            p_tracking_token: token,
          }),
        ]);

        if (trackingResult.error) {
          throw trackingResult.error;
        }

        if (photosResult.error) {
          throw photosResult.error;
        }

        if (signatureResult.error) {
          throw signatureResult.error;
        }

        const trackingJob =
          Array.isArray(trackingResult.data) &&
          trackingResult.data.length > 0
            ? (trackingResult.data[0] as TrackingJob)
            : null;

        if (!trackingJob) {
          setJob(null);
          setPhotos([]);
          setNotFound(true);
          return;
        }

        const photoRows = Array.isArray(photosResult.data)
          ? (photosResult.data as JobPhotoRow[])
          : [];

        const photoGallery = photoRows.map((photo) => {
          const { data } = supabase.storage
            .from("job-photos")
            .getPublicUrl(photo.photo_path);

          return {
            ...photo,
            publicUrl: data.publicUrl,
          };
        });

        const signatureRow =
          Array.isArray(signatureResult.data) &&
          signatureResult.data.length > 0
            ? (signatureResult.data[0] as JobSignatureRow)
            : null;

        const signatureData = signatureRow
          ? {
              ...signatureRow,
              publicUrl: supabase.storage
                .from("job-signatures")
                .getPublicUrl(signatureRow.signature_path).data.publicUrl,
            }
          : null;

        setJob(trackingJob);
        setPhotos(photoGallery);
        setSignature(signatureData);
        if (!signatureName) {
          setSignatureName(trackingJob.customer || "");
        }
        setNotFound(false);
        setErrorMessage("");
      } catch (error: unknown) {
        console.error("Tracking load error:", error);

        const message =
          typeof error === "object" &&
          error !== null &&
          "message" in error
            ? String(error.message)
            : "Tracking information could not be loaded.";

        setErrorMessage(message);
      } finally {
        setLoading(false);
      }
    }

    loadTracking();

    const refreshTimer = window.setInterval(() => {
      loadTracking();
    }, 10000);

    return () => {
      window.clearInterval(refreshTimer);
    };
  }, [token]);

  function formatDate(date: string | null) {
    if (!date) {
      return "Date not set";
    }

    return new Date(`${date}T12:00:00`).toLocaleDateString(
      "en-GB",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );
  }

  function formatTime(time: string | null) {
    if (!time) {
      return "Time not set";
    }

    return time.slice(0, 5);
  }

  function formatLocationUpdate(value: string | null) {
    if (!value) {
      return "Waiting for the driver’s location";
    }

    return new Date(value).toLocaleString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      day: "numeric",
      month: "short",
    });
  }

  function formatPhotoTime(value: string) {
    return new Date(value).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function currentStep(status: string) {
    if (status === "Paid") {
      return trackingSteps.indexOf("Completed");
    }

    if (status === "Cancelled") {
      return -1;
    }

    const index = trackingSteps.indexOf(status);

    return index >= 0 ? index : 0;
  }

  function mapUrl(latitude: number, longitude: number) {
    const offset = 0.008;

    const left = longitude - offset;
    const bottom = latitude - offset;
    const right = longitude + offset;
    const top = latitude + offset;

    return (
      "https://www.openstreetmap.org/export/embed.html" +
      `?bbox=${left}%2C${bottom}%2C${right}%2C${top}` +
      `&layer=mapnik&marker=${latitude}%2C${longitude}`
    );
  }

  function openMapUrl(latitude: number, longitude: number) {
    return `https://www.google.com/maps?q=${latitude},${longitude}`;
  }


  function canvasPoint(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function startSignature(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(event.pointerId);
    const context = canvas.getContext("2d");
    if (!context) return;
    const point = canvasPoint(event);
    context.beginPath();
    context.moveTo(point.x, point.y);
    drawingRef.current = true;
  }

  function drawSignature(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const point = canvasPoint(event);
    context.lineWidth = 5;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#111827";
    context.lineTo(point.x, point.y);
    context.stroke();
  }

  function stopSignature() {
    drawingRef.current = false;
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    setSignatureMessage("");
  }

  async function submitSignature() {
    const canvas = canvasRef.current;
    if (!canvas || !token) return;
    if (!signatureName.trim()) {
      setSignatureMessage("Please enter your name.");
      return;
    }

    setSubmittingSignature(true);
    setSignatureMessage("Saving signature...");

    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((value) => {
          if (value) resolve(value);
          else reject(new Error("Could not create signature image."));
        }, "image/png");
      });

      const path = `${token}/signature_${Date.now()}.png`;
      const upload = await supabase.storage
        .from("job-signatures")
        .upload(path, blob, {
          contentType: "image/png",
          upsert: false,
        });

      if (upload.error) throw upload.error;

      const saveResult = await supabase.rpc("save_customer_signature", {
        p_tracking_token: token,
        p_customer_name: signatureName.trim(),
        p_signature_path: path,
      });

      if (saveResult.error) throw saveResult.error;

      const publicUrl = supabase.storage
        .from("job-signatures")
        .getPublicUrl(path).data.publicUrl;

      setSignature({
        customer_name: signatureName.trim(),
        signature_path: path,
        signed_at: new Date().toISOString(),
        publicUrl,
      });
      setJob((current) =>
        current
          ? { ...current, status: "Completed", live_tracking_enabled: false }
          : current
      );
      setSignatureMessage("Thank you. Your signature has been saved.");
    } catch (error: unknown) {
      const message =
        typeof error === "object" &&
        error !== null &&
        "message" in error
          ? String(error.message)
          : "The signature could not be saved.";
      setSignatureMessage(message);
    } finally {
      setSubmittingSignature(false);
    }
  }

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={cardStyle}>
          <h1 style={{ marginTop: 0 }}>Marketplace Movers</h1>

          <p style={{ color: "#aab4c3" }}>
            Loading your tracking information...
          </p>
        </div>
      </main>
    );
  }

  if (notFound) {
    return (
      <main style={pageStyle}>
        <div
  style={{
    background: "#0f172a",
    border: "1px solid #26364c",
    borderRadius: "18px",
    padding: "24px",
    marginBottom: "24px",
  }}
>
          <h1 style={{ marginTop: 0 }}>
            Tracking link unavailable
          </h1>

          <p style={{ color: "#aab4c3" }}>
            This tracking link is invalid, expired or has been
            disabled.
          </p>
        </div>
      </main>
    );
  }

  if (!job) {
    return null;
  }

  const activeStep = currentStep(job.status);

  const hasLocation =
    job.live_tracking_enabled &&
    job.driver_latitude !== null &&
    job.driver_longitude !== null;

  const latestPhoto = photos.length > 0 ? photos[photos.length - 1] : null;
  const displayStatus = job.status || "Booked";

  return (
    <main style={pageStyle}>
      <section style={portalStyle}>
        <div style={heroStyle}>
          <img
            src="/marketplace-customer-banner.png"
            alt="Marketplace Movers — We collect, you relax"
            style={heroImageStyle}
          />
        </div>

        {errorMessage && <div style={errorBannerStyle}>{errorMessage}</div>}

        <div style={summaryGridStyle}>
          <div style={{ ...panelStyle, gridColumn: "span 2" }}>
            <div style={summaryHeaderStyle}>
              <div>
                <p style={eyebrowStyle}>YOUR DELIVERY</p>
                <h2 style={sectionTitleStyle}>{job.customer || "Customer"}</h2>
                <p style={mutedStyle}>{job.job_type || "Moving job"}</p>
              </div>
              <span style={statusPillStyle(displayStatus)}>{displayStatus}</span>
            </div>

            <div style={routeGridStyle}>
              <div
  style={{
    background: "#0f172a",
    border: "1px solid #26364c",
    borderRadius: "18px",
    padding: "24px",
    marginBottom: "24px",
  }}
>
                <span style={routeIconStyle}>A</span>
                <div>
                  <span style={smallLabelStyle}>Collection</span>
                  <strong>{job.collection || "Not supplied"}</strong>
                </div>
              </div>
              <div style={routeLineStyle} />
              <div style={routeCardStyle}>
                <span style={{ ...routeIconStyle, background: "#22c55e" }}>B</span>
                <div>
                  <span style={smallLabelStyle}>Delivery</span>
                  <strong>{job.delivery || "Not supplied"}</strong>
                </div>
              </div>
            </div>
          </div>

          <div style={metricCardStyle}>
            <span style={smallLabelStyle}>Estimated arrival</span>
            <strong style={metricValueStyle}>{formatTime(job.job_time)}</strong>
            <span style={metricSubtextStyle}>Scheduled delivery time</span>
          </div>

          <div style={metricCardStyle}>
            <span style={smallLabelStyle}>Booking date</span>
            <strong style={{ ...metricValueStyle, fontSize: "22px" }}>
              {formatDate(job.job_date)}
            </strong>
            <span style={metricSubtextStyle}>Updates refresh every 10 seconds</span>
          </div>
        </div>

        <div style={panelStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <p style={eyebrowStyle}>DELIVERY PROGRESS</p>
              <h2 style={sectionTitleStyle}>Follow every step</h2>
            </div>
          </div>

          {job.status === "Cancelled" ? (
            <div style={cancelledStyle}>
              This booking has been cancelled. Please contact Marketplace Movers if you need help.
            </div>
          ) : (
            <div style={timelineStyle}>
              {trackingSteps.map((step, index) => {
                const complete = index <= activeStep;
                const current = index === activeStep;
                return (
                  <div key={step} style={timelineItemStyle}>
                    <div style={timelineTopStyle}>
                      <div style={timelineDotStyle(complete, current)}>
                        {complete ? "✓" : index + 1}
                      </div>
                      {index < trackingSteps.length - 1 && (
                        <div style={timelineConnectorStyle(index < activeStep)} />
                      )}
                    </div>
                    <strong style={timelineLabelStyle(current)}>{step}</strong>
                  </div>
                );
              })}
            </div>
          )}
        </div>


        <div style={sectionHeaderStyle}>
          <div>
            <p style={eyebrowStyle}>LIVE TRACKING</p>
            <h2 style={sectionTitleStyle}>
              {hasLocation
                ? "Your driver is on the way"
                : job.status === "Booked"
                  ? "Your journey has not started yet"
                  : "Waiting for live location"}
            </h2>
            <p style={mutedStyle}>
              {hasLocation
                ? "The van location refreshes automatically every 10 seconds."
                : "The map will appear automatically when live tracking starts."}
            </p>
          </div>
          <span style={livePillStyle(hasLocation)}>
            {hasLocation ? "● LIVE" : "OFFLINE"}
          </span>
        </div>

        <div style={mapPanelStyle}>
          {hasLocation &&
          job.driver_latitude !== null &&
          job.driver_longitude !== null ? (
            <>
              <iframe
                title="Marketplace Movers live van location"
                src={mapUrl(job.driver_latitude, job.driver_longitude)}
                style={mapStyle}
                loading="lazy"
              />
              <div style={mapFooterStyle}>
                <div>
                  <strong>Last update</strong>
                  <p style={mapMetaStyle}>
                    {formatLocationUpdate(job.driver_location_updated_at)}
                    {job.driver_location_accuracy !== null
                      ? ` · approx. ${Math.round(job.driver_location_accuracy)}m accuracy`
                      : ""}
                  </p>
                </div>
                <a
                  href={openMapUrl(job.driver_latitude, job.driver_longitude)}
                  target="_blank"
                  rel="noreferrer"
                  style={primaryLinkStyle}
                >
                  Open in Maps
                </a>
              </div>
            </>
          ) : (
            <div style={emptyStateStyle}>
              <div style={emptyIconStyle}>🚚</div>
              <h3 style={{ margin: "0 0 8px" }}>Live location not shared yet</h3>
              <p style={mutedStyle}>
                The map will appear automatically when your driver starts tracking.
              </p>
            </div>
          )}
        </div>

        <div style={photoFeatureGridStyle}>
          <div style={panelStyle}>
            <div style={sectionHeaderStyle}>
              <div>
                <p style={eyebrowStyle}>LATEST UPDATE</p>
                <h2 style={sectionTitleStyle}>Latest delivery photo</h2>
              </div>
              <span style={photoCountStyle}>
                {photos.length} photo{photos.length === 1 ? "" : "s"}
              </span>
            </div>

            {latestPhoto ? (
              <button
                type="button"
                onClick={() => setSelectedPhoto(latestPhoto)}
                style={featuredPhotoButtonStyle}
              >
                <img
                  src={latestPhoto.publicUrl}
                  alt={latestPhoto.caption || "Latest delivery photo"}
                  style={featuredPhotoStyle}
                />
                <div style={featuredCaptionStyle}>
                  <strong>{latestPhoto.caption || "Delivery update"}</strong>
                  <span>{formatPhotoTime(latestPhoto.created_at)}</span>
                </div>
              </button>
            ) : (
              <div style={emptyStateStyle}>
                <div style={emptyIconStyle}>📷</div>
                <h3 style={{ margin: "0 0 8px" }}>No photos yet</h3>
                <p style={mutedStyle}>Your driver’s photos will appear here automatically.</p>
              </div>
            )}
          </div>

          <div style={driverCardStyle}>
            <div style={driverAvatarStyle}>LW</div>
            <p style={eyebrowStyle}>YOUR DRIVER</p>
            <h2 style={{ ...sectionTitleStyle, marginTop: "6px" }}>Luke Woodward</h2>
            <p style={mutedStyle}>Owner / Driver · Marketplace Movers</p>
            <div style={ratingStyle}>★★★★★</div>
            <p style={{ ...mutedStyle, lineHeight: 1.6 }}>
              Friendly, reliable furniture collection and delivery across South Wales.
            </p>
            <div style={driverActionsStyle}>
              <a href="tel:07940790267" style={secondaryLinkStyle}>Call Luke</a>
              <a
                href="https://wa.me/447940790267"
                target="_blank"
                rel="noreferrer"
                style={primaryLinkStyle}
              >
                WhatsApp
              </a>
            </div>
          </div>
        </div>

        {photos.length > 1 && (
          <div style={panelStyle}>
            <div style={sectionHeaderStyle}>
              <div>
                <p style={eyebrowStyle}>PHOTO GALLERY</p>
                <h2 style={sectionTitleStyle}>All job photos</h2>
              </div>
            </div>
            <div style={galleryStyle}>
              {photos.map((photo) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setSelectedPhoto(photo)}
                  style={galleryButtonStyle}
                >
                  <img
                    src={photo.publicUrl}
                    alt={photo.caption || "Customer items"}
                    style={galleryImageStyle}
                  />
                  <div style={galleryCaptionStyle}>
                    <strong>{photo.caption || "Items photo"}</strong>
                    <span>{photo.photo_type} · {formatPhotoTime(photo.created_at)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={panelStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <p style={eyebrowStyle}>PROOF OF DELIVERY</p>
              <h2 style={sectionTitleStyle}>Customer signature</h2>
            </div>
          </div>

          {signature ? (
            <div style={signatureSavedStyle}>
              <div>
                <strong style={{ fontSize: "20px" }}>
                  Signed by {signature.customer_name || "Customer"}
                </strong>
                <p style={mutedStyle}>Signed {formatPhotoTime(signature.signed_at)}</p>
              </div>
              <img
                src={signature.publicUrl}
                alt="Customer delivery signature"
                style={signatureImageStyle}
              />
            </div>
          ) : job.status === "Cancelled" ? (
            <p style={mutedStyle}>This booking was cancelled.</p>
          ) : job.status !== "Ready for Signature" ? (
            <div style={emptyStateStyle}>
              <div style={emptyIconStyle}>✍️</div>
              <h3 style={{ margin: "0 0 8px" }}>Waiting for delivery</h3>
              <p style={mutedStyle}>
                The signature box appears when the driver marks the delivery ready to sign.
              </p>
            </div>
          ) : (
            <>
              <p style={mutedStyle}>
                Please sign below to confirm your items were delivered safely.
              </p>
              <input
                value={signatureName}
                onChange={(event) => setSignatureName(event.target.value)}
                placeholder="Your full name"
                style={inputStyle}
              />
              <canvas
                ref={canvasRef}
                width={900}
                height={320}
                onPointerDown={startSignature}
                onPointerMove={drawSignature}
                onPointerUp={stopSignature}
                onPointerCancel={stopSignature}
                onPointerLeave={stopSignature}
                style={signatureCanvasStyle}
              />
              <div style={signatureButtonsStyle}>
                <button type="button" onClick={clearSignature} style={secondaryButtonStyle}>
                  Clear
                </button>
                <button
                  type="button"
                  onClick={submitSignature}
                  disabled={submittingSignature}
                  style={primaryButtonStyle}
                >
                  {submittingSignature ? "Saving..." : "Submit signature"}
                </button>
              </div>
              {signatureMessage && (
                <p style={{ color: signatureMessage.startsWith("Thank") ? "#4ade80" : "#fca5a5" }}>
                  {signatureMessage}
                </p>
              )}
            </>
          )}
        </div>

        {job.status === "Completed" && (
          <div style={reviewCardStyle}>
            <div style={{ fontSize: "32px" }}>⭐⭐⭐⭐⭐</div>
            <h2 style={{ margin: "10px 0" }}>Thank you for choosing Marketplace Movers</h2>
            <p style={{ ...mutedStyle, maxWidth: "620px", margin: "0 auto 20px" }}>
              We hope everything went smoothly. A quick Facebook review helps local customers find us.
            </p>
            <a
              href="https://www.facebook.com/MarketplaceMoversWales/reviews"
              target="_blank"
              rel="noreferrer"
              style={reviewButtonStyle}
            >
              Leave a Facebook review
            </a>
          </div>
        )}

        <footer style={footerStyle}>
          Marketplace Movers · South Wales · 07940 790267
        </footer>
      </section>

      {selectedPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Item photo preview"
          onClick={() => setSelectedPhoto(null)}
          style={modalStyle}
        >
          <div onClick={(event) => event.stopPropagation()} style={modalContentStyle}>
            <button
              type="button"
              onClick={() => setSelectedPhoto(null)}
              style={modalCloseStyle}
              aria-label="Close photo"
            >
              ×
            </button>
            <img
              src={selectedPhoto.publicUrl}
              alt={selectedPhoto.caption || "Customer items"}
              style={modalImageStyle}
            />
            <div style={modalCaptionStyle}>
              <strong>{selectedPhoto.caption || "Items photo"}</strong>
              <span>{selectedPhoto.photo_type} · {formatPhotoTime(selectedPhoto.created_at)}</span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, #04070d 0%, #07111f 48%, #04070d 100%)",
  color: "white",
  fontFamily: "Inter, Arial, sans-serif",
  display: "flex",
  justifyContent: "center",
  padding: "24px 14px 48px",
};

const portalStyle = {
  width: "100%",
  maxWidth: "1180px",
  display: "grid",
  gap: "18px",
};

const heroStyle = {
  position: "relative" as const,
  minHeight: "210px",
  borderRadius: "24px",
  overflow: "hidden",
  border: "1px solid #1d4ed8",
  boxShadow: "0 24px 70px rgba(0, 80, 255, 0.22)",
  background: "linear-gradient(135deg, #061a45, #020617)",
};

const heroImageStyle = {
  width: "100%",
  height: "100%",
  minHeight: "210px",
  objectFit: "cover" as const,
  display: "block",
};


const errorBannerStyle = { background: "#451a1a", border: "1px solid #991b1b", borderRadius: "14px", padding: "14px" };
const summaryGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "18px" };
const cardStyle = {
  background: "#0f172a",
  border: "1px solid #26364c",
  borderRadius: "18px",
  padding: "24px",
  marginBottom: "24px",
};

const panelStyle = { background: "rgba(15, 23, 42, .92)", border: "1px solid #22314a", borderRadius: "20px", padding: "clamp(18px, 3vw, 28px)", boxShadow: "0 16px 45px rgba(0,0,0,.18)" };
const summaryHeaderStyle = { display: "flex", justifyContent: "space-between", gap: "18px", alignItems: "flex-start", flexWrap: "wrap" as const };
const eyebrowStyle = { margin: 0, color: "#60a5fa", fontSize: "12px", fontWeight: 800, letterSpacing: "0.14em" };
const sectionTitleStyle = { margin: "7px 0 0", fontSize: "clamp(23px, 3.5vw, 32px)" };
const mutedStyle = { color: "#94a3b8", margin: "8px 0 0" };
const statusPillStyle = (status: string) => ({ background: status === "Cancelled" ? "#991b1b" : status === "Completed" ? "#166534" : "#1d4ed8", color: "white", borderRadius: "999px", padding: "10px 15px", fontWeight: 800, whiteSpace: "nowrap" as const });
const routeGridStyle = { marginTop: "24px", display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "14px", alignItems: "center" };
const routeCardStyle = { display: "flex", gap: "12px", alignItems: "center", background: "#09111e", border: "1px solid #213149", borderRadius: "14px", padding: "15px" };
const routeIconStyle = { width: "34px", height: "34px", borderRadius: "50%", background: "#2563eb", display: "grid", placeItems: "center", fontWeight: 900 };
const routeLineStyle = { width: "34px", height: "2px", background: "linear-gradient(90deg,#2563eb,#22c55e)" };
const smallLabelStyle = { display: "block", color: "#94a3b8", fontSize: "12px", marginBottom: "4px" };
const metricCardStyle = { background: "linear-gradient(160deg,#0f1d33,#0b1220)", border: "1px solid #233653", borderRadius: "20px", padding: "24px", display: "grid", alignContent: "center", minHeight: "150px" };
const metricValueStyle = { fontSize: "34px", marginTop: "8px" };
const metricSubtextStyle = { color: "#64748b", marginTop: "8px", fontSize: "13px" };
const sectionHeaderStyle = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px", flexWrap: "wrap" as const };
const livePillStyle = (live: boolean) => ({ background: live ? "#166534" : "#334155", borderRadius: "999px", padding: "8px 12px", fontWeight: 800, fontSize: "13px" });
const mapPanelStyle = { ...panelStyle, padding: "10px", overflow: "hidden" };
const mapStyle = { width: "100%", height: "clamp(340px, 55vw, 560px)", border: 0, borderRadius: "14px", display: "block" };
const mapFooterStyle = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px", padding: "14px 8px 5px", flexWrap: "wrap" as const };
const mapMetaStyle = { color: "#94a3b8", margin: "5px 0 0", fontSize: "13px" };
const primaryLinkStyle = { display: "inline-block", background: "#2563eb", color: "white", textDecoration: "none", padding: "12px 17px", borderRadius: "10px", fontWeight: 800, textAlign: "center" as const };
const secondaryLinkStyle = { ...primaryLinkStyle, background: "#1e293b", border: "1px solid #475569" };
const emptyStateStyle = { minHeight: "190px", display: "grid", placeItems: "center", alignContent: "center", textAlign: "center" as const, padding: "28px", background: "#09111e", border: "1px dashed #334155", borderRadius: "14px" };
const emptyIconStyle = { fontSize: "36px", marginBottom: "10px" };
const cancelledStyle = { marginTop: "18px", background: "#451a1a", border: "1px solid #991b1b", borderRadius: "12px", padding: "16px" };
const timelineStyle = { marginTop: "26px", display: "grid", gridTemplateColumns: `repeat(${trackingSteps.length}, minmax(0, 1fr))`, gap: "4px" };
const timelineItemStyle = { minWidth: 0, textAlign: "center" as const };
const timelineTopStyle = { display: "flex", alignItems: "center" };
const timelineDotStyle = (complete: boolean, current: boolean) => ({ width: "38px", height: "38px", borderRadius: "50%", display: "grid", placeItems: "center", flexShrink: 0, background: complete ? "#2563eb" : "#1e293b", border: current ? "4px solid #93c5fd" : "2px solid #334155", boxShadow: current ? "0 0 24px rgba(59,130,246,.7)" : "none", fontWeight: 900 });
const timelineConnectorStyle = (complete: boolean) => ({ height: "4px", flex: 1, background: complete ? "linear-gradient(90deg,#2563eb,#60a5fa)" : "#334155", borderRadius: "999px" });
const timelineLabelStyle = (current: boolean) => ({ display: "block", marginTop: "10px", color: current ? "#93c5fd" : "#cbd5e1", fontSize: "13px" });
const photoFeatureGridStyle = { display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(260px, 1fr)", gap: "18px" };
const photoCountStyle = { background: "#166534", borderRadius: "999px", padding: "8px 12px", fontWeight: 800, fontSize: "13px" };
const featuredPhotoButtonStyle = { width: "100%", marginTop: "18px", padding: 0, border: "1px solid #2a3b57", borderRadius: "16px", overflow: "hidden", background: "#09111e", color: "white", textAlign: "left" as const, cursor: "pointer" };
const featuredPhotoStyle = { width: "100%", height: "clamp(300px, 48vw, 520px)", objectFit: "cover" as const, display: "block" };
const featuredCaptionStyle = { display: "flex", justifyContent: "space-between", gap: "12px", padding: "14px", color: "#cbd5e1", flexWrap: "wrap" as const };
const driverCardStyle = { ...panelStyle, background: "linear-gradient(160deg,#102044,#0b1220)", display: "flex", flexDirection: "column" as const, justifyContent: "center" };
const driverAvatarStyle = { width: "72px", height: "72px", borderRadius: "50%", display: "grid", placeItems: "center", background: "linear-gradient(135deg,#2563eb,#60a5fa)", fontSize: "24px", fontWeight: 900, marginBottom: "18px" };
const ratingStyle = { color: "#facc15", letterSpacing: "4px", fontSize: "20px", marginTop: "14px" };
const driverActionsStyle = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "18px" };
const galleryStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px", marginTop: "18px" };
const galleryButtonStyle = { padding: 0, border: "1px solid #26364c", borderRadius: "14px", overflow: "hidden", background: "#09111e", color: "white", textAlign: "left" as const, cursor: "pointer" };
const galleryImageStyle = { width: "100%", height: "220px", objectFit: "cover" as const, display: "block" };
const galleryCaptionStyle = { padding: "13px", display: "grid", gap: "6px", color: "#94a3b8", fontSize: "13px" };
const signatureSavedStyle = { display: "grid", gridTemplateColumns: "minmax(220px, 1fr) minmax(280px, 1fr)", gap: "18px", alignItems: "center", marginTop: "18px" };
const signatureImageStyle = { width: "100%", maxHeight: "260px", objectFit: "contain" as const, background: "white", borderRadius: "12px", padding: "10px" };
const inputStyle = { width: "100%", boxSizing: "border-box" as const, background: "#09111e", color: "white", border: "1px solid #26364c", borderRadius: "10px", padding: "13px", marginBottom: "12px", fontSize: "16px" };
const signatureCanvasStyle = { width: "100%", height: "220px", background: "white", borderRadius: "12px", touchAction: "none", display: "block" };
const signatureButtonsStyle = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "12px" };
const primaryButtonStyle = { background: "#2563eb", color: "white", border: 0, borderRadius: "10px", padding: "13px", fontWeight: 800, cursor: "pointer" };
const secondaryButtonStyle = { background: "#334155", color: "white", border: "1px solid #475569", borderRadius: "10px", padding: "13px", fontWeight: 800, cursor: "pointer" };
const reviewCardStyle = { ...panelStyle, textAlign: "center" as const, background: "linear-gradient(160deg,#132a55,#0b1220)", borderColor: "#315a9f" };
const reviewButtonStyle = { display: "inline-block", background: "#1877f2", color: "white", textDecoration: "none", padding: "14px 26px", borderRadius: "10px", fontWeight: 800 };
const footerStyle = { textAlign: "center" as const, color: "#64748b", padding: "16px" };
const modalStyle = { position: "fixed" as const, inset: 0, zIndex: 9999, background: "rgba(0,0,0,.94)", padding: "20px", display: "grid", placeItems: "center", cursor: "zoom-out" };
const modalContentStyle = { width: "100%", maxWidth: "1000px", maxHeight: "94vh", display: "grid", gap: "12px" };
const modalCloseStyle = { justifySelf: "end", background: "#1f2937", color: "white", border: "1px solid #475569", borderRadius: "999px", width: "42px", height: "42px", fontSize: "22px", cursor: "pointer" };
const modalImageStyle = { width: "100%", maxHeight: "78vh", objectFit: "contain" as const, borderRadius: "14px", background: "#05070b" };
const modalCaptionStyle = { background: "#111823", border: "1px solid #243247", borderRadius: "12px", padding: "14px", display: "grid", gap: "6px", color: "#94a3b8" };