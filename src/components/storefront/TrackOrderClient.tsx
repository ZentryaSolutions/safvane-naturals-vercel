"use client";

import { useState, type ReactNode } from "react";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Loader2,
  MapPin,
  Package,
  Truck,
  Warehouse,
} from "lucide-react";

type ShipmentHistoryItem = {
  message: string;
  code?: string;
  at?: string;
};

type TrackResponse = {
  error?: string;
  shipment?: {
    trackingNumber: string;
    status: string;
    cityName?: string | null;
    orderRefNumber?: string | null;
    orderPickupDate?: string | null;
    orderDeliveryDate?: string | null;
    history: ShipmentHistoryItem[];
    provider: string;
  };
};

function formatJourneyTime(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone: "Asia/Karachi",
  });
}

function formatMetaDate(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Karachi",
  });
}

function journeyIcon(message: string): ReactNode {
  const m = message.toLowerCase();
  if (m.includes("delivered")) return <CheckCircle2 size={16} />;
  if (m.includes("departed") || m.includes("en-route") || m.includes("root"))
    return <Truck size={16} />;
  if (m.includes("arrived") || m.includes("transit") || m.includes("hub"))
    return <MapPin size={16} />;
  if (m.includes("received") || m.includes("warehouse") || m.includes("postex"))
    return <Warehouse size={16} />;
  if (m.includes("merchant") || m.includes("safvane"))
    return <Building2 size={16} />;
  if (m.includes("attempt")) return <ArrowRight size={16} />;
  return <Package size={16} />;
}

export function TrackOrderClient() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<TrackResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingNumber: trackingNumber.trim(),
        }),
      });
      const data = (await res.json()) as TrackResponse;
      if (!res.ok) {
        setError(data.error || "Unable to track this ID.");
        setLoading(false);
        return;
      }
      setResult(data);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const shipment = result?.shipment;
  const history = shipment?.history?.length
    ? [...shipment.history].reverse()
    : [];
  const latestAt = history[0]?.at;

  return (
    <div className="track-page">
      <div className="track-shell">
        <header className="track-hero">
          <p className="track-eyebrow">PostEx tracking</p>
          <h1>
            Track your <em>order</em>
          </h1>
          <p className="track-sub">
            Enter the tracking ID from your courier message or invoice.
          </p>
        </header>

        <form className="track-form" onSubmit={handleSubmit}>
          <div className="track-input-row">
            <div className="fg full track-input-field">
              <label htmlFor="track-id">Tracking ID</label>
              <input
                id="track-id"
                required
                inputMode="numeric"
                autoComplete="off"
                placeholder=""
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="btn track-submit"
              disabled={loading}
            >
              <span>
                {loading ? (
                  <>
                    <Loader2 size={18} className="track-spinner" aria-hidden />
                    Checking…
                  </>
                ) : (
                  "Track"
                )}
              </span>
            </button>
          </div>
          {error && <div className="stock-warn track-error">{error}</div>}
        </form>

        {shipment && (
          <div className="track-result">
            <section className="track-status-banner">
              <div className="track-status-banner-icon" aria-hidden>
                <Truck size={22} />
              </div>
              <div className="track-status-banner-copy">
                <p className="track-status-label">Current status</p>
                <h2 className="track-shipment-status">{shipment.status}</h2>
                {latestAt && (
                  <p className="track-status-time">
                    {formatJourneyTime(latestAt)}
                  </p>
                )}
              </div>
            </section>

            <section className="track-card">
              <div className="track-meta-grid">
                <div className="track-meta-item">
                  <span className="track-meta-ico" aria-hidden>
                    <Package size={16} />
                  </span>
                  <div>
                    <p className="track-meta-label">Tracking ID</p>
                    <p className="track-meta-value track-id">
                      {shipment.trackingNumber}
                    </p>
                  </div>
                </div>
                {shipment.orderRefNumber && (
                  <div className="track-meta-item">
                    <span className="track-meta-ico" aria-hidden>
                      <Package size={16} />
                    </span>
                    <div>
                      <p className="track-meta-label">Order reference</p>
                      <p className="track-meta-value">
                        {shipment.orderRefNumber}
                      </p>
                    </div>
                  </div>
                )}
                {shipment.cityName && (
                  <div className="track-meta-item">
                    <span className="track-meta-ico" aria-hidden>
                      <MapPin size={16} />
                    </span>
                    <div>
                      <p className="track-meta-label">City</p>
                      <p className="track-meta-value">{shipment.cityName}</p>
                    </div>
                  </div>
                )}
                {shipment.orderPickupDate && (
                  <div className="track-meta-item">
                    <div>
                      <p className="track-meta-label">Picked up</p>
                      <p className="track-meta-value">
                        {formatMetaDate(shipment.orderPickupDate)}
                      </p>
                    </div>
                  </div>
                )}
                {shipment.orderDeliveryDate && (
                  <div className="track-meta-item">
                    <div>
                      <p className="track-meta-label">Delivered</p>
                      <p className="track-meta-value">
                        {formatMetaDate(shipment.orderDeliveryDate)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {history.length > 0 && (
              <section className="track-card track-journey">
                <h3 className="track-journey-title">Shipment status</h3>
                <ol className="track-timeline">
                  {history.map((item, i) => {
                    const timeLabel = formatJourneyTime(item.at);
                    return (
                      <li
                        key={`${item.code ?? item.message}-${i}`}
                        className={i === 0 ? "is-latest" : undefined}
                      >
                        <span className="track-timeline-marker" aria-hidden>
                          {journeyIcon(item.message)}
                        </span>
                        <div className="track-timeline-body">
                          <strong>{item.message}</strong>
                          {timeLabel && (
                            <time dateTime={item.at}>{timeLabel}</time>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
