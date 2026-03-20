"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getApiErrorMessage } from "@/lib/api";
import {
  createAsset,
  createBeds,
  getBeds,
  getRooms,
} from "@/lib/services/inventory.service";
import type { Bed, Room } from "@/lib/types";
import { ASSET_CONDITIONS, type AssetCondition } from "@/lib/types";
import { Building, Loader2, Plus } from "lucide-react";
import { useEffect, useState } from "react";

export default function InventoryManagement() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Create beds form
  const [showBedForm, setShowBedForm] = useState(false);
  const [bedForm, setBedForm] = useState({ roomId: "", bedLabels: "" });
  const [creatingBeds, setCreatingBeds] = useState(false);

  // Create asset form
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [assetForm, setAssetForm] = useState({
    name: "",
    quantity: "1",
    assetCondition: "GOOD" as AssetCondition,
  });
  const [creatingAsset, setCreatingAsset] = useState(false);

  const fetchData = async () => {
    try {
      const [roomsRes, bedsRes] = await Promise.allSettled([
        getRooms(),
        getBeds(),
      ]);
      if (roomsRes.status === "fulfilled")
        setRooms(roomsRes.value.data?.rooms ?? []);
      if (bedsRes.status === "fulfilled")
        setBeds(bedsRes.value.data?.beds ?? []);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateBeds = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingBeds(true);
    setError(null);
    setSuccess(null);
    try {
      const labels = bedForm.bedLabels
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean);
      await createBeds({
        roomId: bedForm.roomId,
        beds: labels.map((label) => ({ bedLabel: label })),
      });
      setSuccess("Beds created successfully!");
      setShowBedForm(false);
      setBedForm({ roomId: "", bedLabels: "" });
      await fetchData();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setCreatingBeds(false);
    }
  };

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingAsset(true);
    setError(null);
    setSuccess(null);
    try {
      await createAsset({
        name: assetForm.name,
        quantity: Number(assetForm.quantity),
        assetCondition: assetForm.assetCondition,
      });
      setSuccess("Asset created successfully!");
      setShowAssetForm(false);
      setAssetForm({ name: "", quantity: "1", assetCondition: "GOOD" });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setCreatingAsset(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Building className="h-8 w-8" />
          Inventory Management
        </h2>
        <p className="text-muted-foreground mt-1">
          Manage rooms, beds, and assets
        </p>
      </div>

      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg dark:text-green-400 dark:bg-green-950 dark:border-green-900">
          {success}
        </div>
      )}

      <Tabs defaultValue="rooms">
        <TabsList>
          <TabsTrigger value="rooms">Rooms ({rooms.length})</TabsTrigger>
          <TabsTrigger value="beds">Beds ({beds.length})</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
        </TabsList>

        {/* Rooms Tab */}
        <TabsContent value="rooms" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Rooms</CardTitle>
            </CardHeader>
            <CardContent>
              {rooms.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No rooms found.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Room Number</TableHead>
                      <TableHead>Hall</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Occupancy</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rooms.map((room) => (
                      <TableRow key={room.id}>
                        <TableCell className="font-mono text-xs">
                          #{room.id.slice(0, 8)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {room.roomNumber}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {room.hall?.replace(/_/g, " ")}
                        </TableCell>
                        <TableCell>{room.capacity}</TableCell>
                        <TableCell>
                          {room.currentOccupancy}/{room.capacity}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              room.roomStatus === "AVAILABLE"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {room.roomStatus}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Beds Tab */}
        <TabsContent value="beds" className="mt-6 space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowBedForm(!showBedForm)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Beds
            </Button>
          </div>

          {showBedForm && (
            <Card>
              <CardHeader>
                <CardTitle>Create Beds</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleCreateBeds}
                  className="space-y-4 max-w-sm"
                >
                  <div className="space-y-2">
                    <Label htmlFor="roomId">Room ID</Label>
                    <Input
                      id="roomId"
                      value={bedForm.roomId}
                      onChange={(e) =>
                        setBedForm({ ...bedForm, roomId: e.target.value })
                      }
                      placeholder="Room UUID"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bedLabels">
                      Bed Labels (comma separated)
                    </Label>
                    <Input
                      id="bedLabels"
                      value={bedForm.bedLabels}
                      onChange={(e) =>
                        setBedForm({ ...bedForm, bedLabels: e.target.value })
                      }
                      placeholder="A, B, C, D"
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={creatingBeds}>
                      {creatingBeds && (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      )}
                      Create
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowBedForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-6">
              {beds.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No beds found.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Label</TableHead>
                      <TableHead>Hall</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {beds.map((bed) => (
                      <TableRow key={bed.id}>
                        <TableCell className="font-mono text-xs">
                          #{bed.id.slice(0, 8)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          #{bed.roomId.slice(0, 8)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {bed.bedLabel}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {bed.hall?.replace(/_/g, " ")}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              bed.bedStatus === "AVAILABLE"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {bed.bedStatus}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assets Tab */}
        <TabsContent value="assets" className="mt-6 space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowAssetForm(!showAssetForm)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Asset
            </Button>
          </div>

          {showAssetForm && (
            <Card>
              <CardHeader>
                <CardTitle>Create Asset</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleCreateAsset}
                  className="space-y-4 max-w-lg"
                >
                  <div className="space-y-2">
                    <Label htmlFor="assetName">Asset Name</Label>
                    <Input
                      id="assetName"
                      value={assetForm.name}
                      onChange={(e) =>
                        setAssetForm({ ...assetForm, name: e.target.value })
                      }
                      placeholder="e.g., Chair, Table, Fan"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="assetQty">Quantity</Label>
                      <Input
                        id="assetQty"
                        type="number"
                        min="1"
                        value={assetForm.quantity}
                        onChange={(e) =>
                          setAssetForm({
                            ...assetForm,
                            quantity: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="assetCondition">Condition</Label>
                      <select
                        id="assetCondition"
                        value={assetForm.assetCondition}
                        onChange={(e) =>
                          setAssetForm({
                            ...assetForm,
                            assetCondition: e.target.value as AssetCondition,
                          })
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        {ASSET_CONDITIONS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={creatingAsset}>
                      {creatingAsset && (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      )}
                      Create Asset
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAssetForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Asset listing is managed through rooms. Create assets and they
              will be associated with their rooms.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
