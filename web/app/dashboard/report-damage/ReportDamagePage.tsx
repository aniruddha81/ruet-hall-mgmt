"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/lib/api";
import { reportDamage } from "@/lib/services/inventory.service";
import { AlertTriangle, CheckCircle2, ImagePlus, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function ReportDamagePage() {
  const [locationDescription, setLocationDescription] = useState("");
  const [assetDetails, setAssetDetails] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [submittedImageUrl, setSubmittedImageUrl] = useState<string | null>(
    null,
  );
  const [imageInputKey, setImageInputKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedLocation = locationDescription.trim();
    const trimmedAsset = assetDetails.trim();

    if (!trimmedLocation || !trimmedAsset) {
      setError("Location and asset details are required.");
      return;
    }

    if (!imageFile) {
      setError("Please upload a damage proof image.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await reportDamage({
        locationDescription: trimmedLocation,
        assetDetails: trimmedAsset,
        image: imageFile,
      });
      setSuccess(
        "Complaint submitted successfully. Inventory management will review it soon.",
      );
      setSubmittedImageUrl(res.data?.imageUrl ?? null);
      setLocationDescription("");
      setAssetDetails("");
      setImageFile(null);
      setImageInputKey((prev) => prev + 1);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Report Damage</h2>
        <p className="mt-1 text-muted-foreground">
          Submit a complaint using only the location description and asset
          details.
        </p>
      </div>

      {success ? (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>New Complaint</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="locationDescription"
                className="text-sm font-medium text-foreground"
              >
                Location Description
              </label>
              <Textarea
                id="locationDescription"
                value={locationDescription}
                onChange={(event) => setLocationDescription(event.target.value)}
                placeholder="Example: Zia Hall, Room 203, near the south window"
                rows={3}
                disabled={submitting}
                required
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="assetDetails"
                className="text-sm font-medium text-foreground"
              >
                Asset Details
              </label>
              <Textarea
                id="assetDetails"
                value={assetDetails}
                onChange={(event) => setAssetDetails(event.target.value)}
                placeholder="Describe the damaged asset and what is wrong with it"
                rows={5}
                disabled={submitting}
                required
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="damageImage"
                className="text-sm font-medium text-foreground"
              >
                Damage Proof Image
              </label>
              <Input
                key={imageInputKey}
                id="damageImage"
                type="file"
                accept="image/*"
                disabled={submitting}
                required
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setImageFile(file);
                }}
              />
              <p className="text-xs text-muted-foreground">
                Upload a clear photo showing the damage.
              </p>
              {imagePreviewUrl ? (
                <div className="overflow-hidden rounded-lg border border-border/60 bg-muted/20">
                  <img
                    src={imagePreviewUrl}
                    alt="Selected damage proof preview"
                    className="h-64 w-full object-cover"
                  />
                </div>
              ) : null}
            </div>

            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Submit Complaint
            </Button>
          </form>
        </CardContent>
      </Card>

      {submittedImageUrl ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImagePlus className="h-5 w-5" />
              Uploaded Proof
            </CardTitle>
          </CardHeader>
          <CardContent>
            <a href={submittedImageUrl} target="_blank" rel="noreferrer">
              <img
                src={submittedImageUrl}
                alt="Uploaded damage proof"
                className="max-h-96 w-full rounded-lg border border-border/60 object-cover"
              />
            </a>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
