"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Printer } from "lucide-react";
import { formatPackDate } from "@/lib/sku";
import { WEBSITE_URL } from "@/lib/constants";
import type { ProductBatch } from "@/lib/types";

interface BoxBackLabelProps {
  productName: string;
  productSlug: string;
  variants: { id: string; variant_label: string }[];
  batches: ProductBatch[];
  embedded?: boolean;
}

export function BoxBackLabel({ batches, embedded }: BoxBackLabelProps) {
  const [batchId, setBatchId] = useState(batches[0]?.id ?? "");
  const [qrUrl, setQrUrl] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  const batch = batches.find((b) => b.id === batchId) ?? batches[0];

  useEffect(() => {
    QRCode.toDataURL(WEBSITE_URL, {
      width: 80,
      margin: 0,
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then(setQrUrl)
      .catch(() => setQrUrl(""));
  }, []);

  useEffect(() => {
    if (batches.length === 0) {
      setBatchId("");
      return;
    }
    setBatchId((current) =>
      batches.some((b) => b.id === current) ? current : batches[0].id
    );
  }, [batches]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className={`admin-card admin-packaging-card box-back-admin${embedded ? " admin-packaging-card-embedded" : ""}`}
    >
      {!embedded && (
        <div className="admin-packaging-card-head">
          <h2 className="admin-section-title">Box back label</h2>
          <button
            type="button"
            className="admin-btn admin-btn-sm"
            onClick={handlePrint}
            disabled={!batch}
          >
            <Printer size={14} />
            Print label
          </button>
        </div>
      )}

      <div className="admin-box-label-layout admin-box-label-layout-simple">
        <div className="admin-box-label-settings admin-form">
          <p className="admin-field-hint">
            Simple vertical block for your box back: batch number, MFG & EXP dates, then QR to{" "}
            <strong>safvane.com</strong>. Place below <em>Made in Pakistan</em> on the box.
          </p>

          <div className="field">
            <label>Batch</label>
            <select value={batchId} onChange={(e) => setBatchId(e.target.value)}>
              {batches.length === 0 ? (
                <option value="">Add a batch first (Batches tab)</option>
              ) : (
                batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.batch_number} — Mfg {formatPackDate(b.manufactured_at)}, Exp{" "}
                    {formatPackDate(b.expires_at)}
                  </option>
                ))
              )}
            </select>
          </div>

          {embedded && (
            <button
              type="button"
              className="admin-btn"
              onClick={handlePrint}
              disabled={!batch}
            >
              <Printer size={14} />
              Print label
            </button>
          )}
        </div>

        <div className="admin-box-label-preview no-print">
          <p className="admin-box-label-preview-title">Preview (on black box panel)</p>
          <BoxBackLabelArt batch={batch} qrUrl={qrUrl} />
        </div>
      </div>

      <div className="box-back-print-area" ref={printRef}>
        <BoxBackLabelArt batch={batch} qrUrl={qrUrl} />
      </div>
    </div>
  );
}

function BoxBackLabelArt({ batch, qrUrl }: { batch?: ProductBatch; qrUrl: string }) {
  if (!batch) {
    return (
      <div className="box-back-label box-back-label-simple box-back-label-empty">
        Select or add a batch to preview
      </div>
    );
  }

  return (
    <div className="box-back-label box-back-label-simple">
      <p className="box-back-line">
        <strong>Batch No:</strong> {batch.batch_number}
      </p>
      <p className="box-back-line">
        <strong>Mfg Date:</strong> {formatPackDate(batch.manufactured_at)}
      </p>
      <p className="box-back-line">
        <strong>Exp Date:</strong> {formatPackDate(batch.expires_at)}
      </p>
      {qrUrl && (
        <div className="box-back-qr-simple">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrUrl} alt="safvane.com" />
        </div>
      )}
    </div>
  );
}
