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
        <div style={cardStyle}>
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

  return (
    <main style={pageStyle}>
      <section
        style={{
          width: "100%",
          maxWidth: "760px",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: "22px",
          }}
        >
          <h1
            style={{
              fontSize: "34px",
              margin: "0 0 8px",
            }}
          >
            Marketplace Movers
          </h1>

          <p
            style={{
              color: "#96a3b5",
              margin: 0,
            }}
          >
            Live booking and van tracking
          </p>
        </div>

        {errorMessage && (
          <div
            style={{
              background: "#451a1a",
              border: "1px solid #991b1b",
              borderRadius: "12px",
              padding: "14px",
              marginBottom: "18px",
            }}
          >
            {errorMessage}
          </div>
        )}

        <div style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <p
                style={{
                  color: "#96a3b5",
                  margin: "0 0 6px",
                }}
              >
                Booking for
              </p>

              <h2 style={{ margin: 0 }}>
                {job.customer || "Customer"}
              </h2>
            </div>

            <span
              style={{
                background:
                  job.status === "Cancelled"
                    ? "#b91c1c"
                    : "#1565ff",
                borderRadius: "999px",
                padding: "9px 14px",
                fontWeight: "bold",
              }}
            >
              {job.status || "Booked"}
            </span>
          </div>

          <div
            style={{
              marginTop: "24px",
              display: "grid",
              gap: "12px",
            }}
          >
            <div style={detailBoxStyle}>
              <span style={detailLabelStyle}>Job</span>
              <strong>{job.job_type || "Moving job"}</strong>
            </div>

            <div style={detailBoxStyle}>
              <span style={detailLabelStyle}>
                Date and time
              </span>

              <strong>
                {formatDate(job.job_date)} at{" "}
                {formatTime(job.job_time)}
              </strong>
            </div>

            <div style={detailBoxStyle}>
              <span style={detailLabelStyle}>
                Collection
              </span>

              <strong>
                {job.collection || "Not supplied"}
              </strong>
            </div>

            <div style={detailBoxStyle}>
              <span style={detailLabelStyle}>
                Delivery
              </span>

              <strong>
                {job.delivery || "Not supplied"}
              </strong>
            </div>
          </div>
        </div>

        <div
          style={{
            ...cardStyle,
            marginTop: "18px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2 style={{ margin: 0 }}>Your items</h2>
              <p
                style={{
                  margin: "7px 0 0",
                  color: "#96a3b5",
                  fontSize: "14px",
                }}
              >
                Photos uploaded by your driver during the job.
              </p>
            </div>

            <span
              style={{
                background: photos.length > 0 ? "#166534" : "#334155",
                borderRadius: "999px",
                padding: "8px 12px",
                fontWeight: "bold",
                fontSize: "13px",
              }}
            >
              {photos.length === 0
                ? "Waiting for photos"
                : `${photos.length} photo${photos.length === 1 ? "" : "s"}`}
            </span>
          </div>

          {photos.length === 0 ? (
            <div
              style={{
                marginTop: "18px",
                background: "#0b111b",
                border: "1px solid #26364c",
                borderRadius: "12px",
                padding: "18px",
              }}
            >
              <p style={{ margin: "0 0 7px" }}>
                No item photos have been uploaded yet.
              </p>
              <p
                style={{
                  margin: 0,
                  color: "#96a3b5",
                  fontSize: "14px",
                }}
              >
                New photos will appear here automatically.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(210px, 1fr))",
                gap: "14px",
                marginTop: "18px",
              }}
            >
              {photos.map((photo) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setSelectedPhoto(photo)}
                  style={{
                    padding: 0,
                    border: "1px solid #26364c",
                    borderRadius: "14px",
                    overflow: "hidden",
                    background: "#0b111b",
                    color: "white",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                  aria-label="Open item photo full screen"
                >
                  <img
                    src={photo.publicUrl}
                    alt={photo.caption || "Customer items"}
                    style={{
                      width: "100%",
                      height: "220px",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />

                  <div style={{ padding: "13px" }}>
                    <strong>
                      {photo.caption || "Items photo"}
                    </strong>
                    <p
                      style={{
                        color: "#96a3b5",
                        margin: "7px 0 0",
                        fontSize: "13px",
                      }}
                    >
                      {photo.photo_type} · {formatPhotoTime(photo.created_at)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            ...cardStyle,
            marginTop: "18px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <h2 style={{ margin: 0 }}>Live van location</h2>

            <span
              style={{
                background: hasLocation ? "#166534" : "#334155",
                borderRadius: "999px",
                padding: "8px 12px",
                fontWeight: "bold",
                fontSize: "13px",
              }}
            >
              {hasLocation
                ? "● LIVE"
                : "Location not currently shared"}
            </span>
          </div>

          {hasLocation &&
          job.driver_latitude !== null &&
          job.driver_longitude !== null ? (
            <>
              <div
                style={{
                  marginTop: "18px",
                  border: "1px solid #26364c",
                  borderRadius: "14px",
                  overflow: "hidden",
                  background: "#0b111b",
                }}
              >
                <iframe
                  title="Marketplace Movers live van location"
                  src={mapUrl(
                    job.driver_latitude,
                    job.driver_longitude
                  )}
                  style={{
                    width: "100%",
                    height: "360px",
                    border: 0,
                    display: "block",
                  }}
                  loading="lazy"
                />
              </div>

              <div
                style={{
                  marginTop: "14px",
                  background: "#0b111b",
                  border: "1px solid #26364c",
                  borderRadius: "12px",
                  padding: "14px",
                }}
              >
                <p style={{ margin: "0 0 6px" }}>
                  <strong>Last location update:</strong>{" "}
                  {formatLocationUpdate(
                    job.driver_location_updated_at
                  )}
                </p>

                {job.driver_location_accuracy !== null && (
                  <p
                    style={{
                      margin: 0,
                      color: "#aab4c3",
                    }}
                  >
                    GPS accuracy: approximately{" "}
                    {Math.round(job.driver_location_accuracy)}{" "}
                    metres
                  </p>
                )}
              </div>

              <a
                href={openMapUrl(
                  job.driver_latitude,
                  job.driver_longitude
                )}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "block",
                  marginTop: "14px",
                  background: "#1d4ed8",
                  color: "white",
                  textDecoration: "none",
                  borderRadius: "10px",
                  padding: "13px",
                  textAlign: "center",
                  fontWeight: "bold",
                }}
              >
                Open van location in Maps
              </a>
            </>
          ) : (
            <div
              style={{
                marginTop: "18px",
                background: "#0b111b",
                border: "1px solid #26364c",
                borderRadius: "12px",
                padding: "18px",
              }}
            >
              <p style={{ margin: "0 0 7px" }}>
                The driver is not currently sharing a live
                location.
              </p>

              <p
                style={{
                  margin: 0,
                  color: "#96a3b5",
                  fontSize: "14px",
                }}
              >
                The map will appear automatically when live
                tracking starts.
              </p>
            </div>
          )}
        </div>

        <div
          style={{
            ...cardStyle,
            marginTop: "18px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Delivery progress</h2>

          {job.status === "Cancelled" ? (
            <div
              style={{
                background: "#451a1a",
                border: "1px solid #991b1b",
                borderRadius: "12px",
                padding: "16px",
              }}
            >
              This booking has been cancelled. Please contact
              Marketplace Movers if you need assistance.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: "12px",
                marginTop: "20px",
              }}
            >
              {trackingSteps.map((step, index) => {
                const complete = index <= activeStep;
                const current = index === activeStep;

                return (
                  <div
                    key={step}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      background: current ? "#102446" : "#0b111b",
                      border: current
                        ? "1px solid #2f7cff"
                        : "1px solid #26364c",
                      borderRadius: "12px",
                      padding: "14px",
                    }}
                  >
                    <div
                      style={{
                        width: "30px",
                        height: "30px",
                        borderRadius: "50%",
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                        background: complete ? "#1565ff" : "#26364c",
                        fontWeight: "bold",
                      }}
                    >
                      {complete ? "✓" : index + 1}
                    </div>

                    <div>
                      <strong>{step}</strong>

                      {current && (
                        <p
                          style={{
                            color: "#8bb8ff",
                            margin: "4px 0 0",
                            fontSize: "14px",
                          }}
                        >
                          Current status
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <p
            style={{
              color: "#718096",
              fontSize: "13px",
              marginBottom: 0,
              marginTop: "18px",
            }}
          >
            Status, photos and location refresh automatically every
            10 seconds.
          </p>
        </div>

        <div
          style={{
            ...cardStyle,
            marginTop: "18px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Delivery signature</h2>

          {signature ? (
            <div style={detailBoxStyle}>
              <strong>Signed by {signature.customer_name || "Customer"}</strong>
              <img
                src={signature.publicUrl}
                alt="Customer delivery signature"
                style={{
                  width: "100%",
                  maxHeight: "240px",
                  objectFit: "contain",
                  background: "white",
                  borderRadius: "10px",
                }}
              />
              <span style={detailLabelStyle}>
                Signed {formatPhotoTime(signature.signed_at)}
              </span>
            </div>
          ) : job.status === "Cancelled" ? (
            <p style={{ color: "#96a3b5" }}>This booking was cancelled.</p>
          ) : job.status !== "Ready for Signature" ? (
            <div style={detailBoxStyle}>
              <strong>Waiting for the driver</strong>
              <span style={detailLabelStyle}>
                The signature box will appear once the driver confirms the delivery is ready to be signed for.
              </span>
            </div>
          ) : (
            <>
              <p style={{ color: "#96a3b5" }}>
                The driver has confirmed delivery. Sign below to confirm the items were delivered safely.
              </p>

              <input
                value={signatureName}
                onChange={(event) => setSignatureName(event.target.value)}
                placeholder="Your full name"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: "#0b111b",
                  color: "white",
                  border: "1px solid #26364c",
                  borderRadius: "10px",
                  padding: "13px",
                  marginBottom: "12px",
                  fontSize: "16px",
                }}
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
                style={{
                  width: "100%",
                  height: "220px",
                  background: "white",
                  borderRadius: "12px",
                  touchAction: "none",
                  display: "block",
                }}
              />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                  marginTop: "12px",
                }}
              >
                <button
                  type="button"
                  onClick={clearSignature}
                  style={secondaryButtonStyle}
                >
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
                <p
                  style={{
                    marginBottom: 0,
                    color: signatureMessage.startsWith("Thank")
                      ? "#4ade80"
                      : "#fca5a5",
                  }}
                >
                  {signatureMessage}
                </p>
              )}
            </>
          )}
        </div>

        {job.status === "Completed" && (
          <div
            style={{
              ...cardStyle,
              marginTop: "18px",
              textAlign: "center",
            }}
          >
            <h2 style={{ marginTop: 0 }}>⭐⭐⭐⭐⭐</h2>

            <p
              style={{
                color: "#96a3b5",
                marginBottom: "20px",
                lineHeight: "1.6",
              }}
            >
              Thank you for choosing Marketplace Movers!
              <br />
              If you were happy with our service, we'd really appreciate a quick Facebook review.
            </p>

            <a
              href="https://www.facebook.com/MarketplaceMoversWales/reviews"
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-block",
                background: "#1877f2",
                color: "white",
                textDecoration: "none",
                padding: "14px 28px",
                borderRadius: "10px",
                fontWeight: "bold",
                fontSize: "16px",
              }}
            >
              ⭐ Leave a Facebook Review
            </a>
          </div>
        )}

      </section>

      {selectedPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Item photo preview"
          onClick={() => setSelectedPhoto(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0, 0, 0, 0.92)",
            padding: "20px",
            display: "grid",
            placeItems: "center",
            cursor: "zoom-out",
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "1000px",
              maxHeight: "94vh",
              display: "grid",
              gap: "12px",
            }}
          >
            <button
              type="button"
              onClick={() => setSelectedPhoto(null)}
              style={{
                justifySelf: "end",
                background: "#1f2937",
                color: "white",
                border: "1px solid #475569",
                borderRadius: "999px",
                width: "42px",
                height: "42px",
                fontSize: "22px",
                cursor: "pointer",
              }}
              aria-label="Close photo"
            >
              ×
            </button>

            <img
              src={selectedPhoto.publicUrl}
              alt={selectedPhoto.caption || "Customer items"}
              style={{
                width: "100%",
                maxHeight: "78vh",
                objectFit: "contain",
                borderRadius: "14px",
                background: "#05070b",
              }}
            />

            <div
              style={{
                background: "#111823",
                border: "1px solid #243247",
                borderRadius: "12px",
                padding: "14px",
              }}
            >
              <strong>
                {selectedPhoto.caption || "Items photo"}
              </strong>
              <p
                style={{
                  margin: "6px 0 0",
                  color: "#96a3b5",
                }}
              >
                {selectedPhoto.photo_type} ·{" "}
                {formatPhotoTime(selectedPhoto.created_at)}
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "#070b12",
  color: "white",
  fontFamily: "Arial, sans-serif",
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
  padding: "35px 18px",
};

const cardStyle = {
  background: "#111823",
  border: "1px solid #243247",
  borderRadius: "18px",
  padding: "24px",
};

const detailBoxStyle = {
  background: "#0b111b",
  border: "1px solid #26364c",
  borderRadius: "12px",
  padding: "14px",
  display: "grid",
  gap: "6px",
};

const detailLabelStyle = {
  color: "#96a3b5",
  fontSize: "13px",
};

const primaryButtonStyle = {
  background: "#1d4ed8",
  color: "white",
  border: 0,
  borderRadius: "10px",
  padding: "13px",
  fontWeight: "bold",
  cursor: "pointer",
};

const secondaryButtonStyle = {
  background: "#334155",
  color: "white",
  border: "1px solid #475569",
  borderRadius: "10px",
  padding: "13px",
  fontWeight: "bold",
  cursor: "pointer",
};