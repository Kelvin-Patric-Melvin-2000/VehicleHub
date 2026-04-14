import { useState } from "react";
import { useDocuments, useCreateDocument, useDeleteDocument, uploadDocumentFile } from "@/hooks/useDocuments";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, FileText, ExternalLink } from "lucide-react";
import { format, parseISO, differenceInDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const DOC_TYPES = ["Insurance", "RC (Registration)", "PUC (Pollution)", "Driving License", "Other"];

function getExpiryBadge(expiryDate: string | null) {
  if (!expiryDate) return null;
  const days = differenceInDays(parseISO(expiryDate), new Date());
  if (days < 0) return <Badge className="bg-destructive text-destructive-foreground">{Math.abs(days)}d expired</Badge>;
  if (days <= 7) return <Badge className="bg-[hsl(38,92%,50%)] text-[hsl(222,47%,6%)]">{days}d left</Badge>;
  if (days <= 30) return <Badge className="bg-[hsl(38,92%,50%)]/80 text-[hsl(222,47%,6%)]">{days}d left</Badge>;
  return <Badge className="bg-[hsl(142,71%,45%)] text-[hsl(222,47%,6%)]">Valid</Badge>;
}

export function DocumentsTab({ vehicleId, readOnly = false }: { vehicleId: string; readOnly?: boolean }) {
  const { data: docs, isLoading } = useDocuments(vehicleId);
  const createDoc = useCreateDocument();
  const deleteDoc = useDeleteDocument();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ document_type: "", document_number: "", issue_date: "", expiry_date: "" });
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      let fileUrl: string | null = null;
      if (file) {
        fileUrl = await uploadDocumentFile(file);
      }
      await createDoc.mutateAsync({
        vehicle_id: vehicleId,
        document_type: form.document_type,
        document_number: form.document_number || null,
        issue_date: form.issue_date || null,
        expiry_date: form.expiry_date || null,
        file_url: fileUrl,
      });
      setOpen(false);
      setForm({ document_type: "", document_number: "", issue_date: "", expiry_date: "" });
      setFile(null);
      toast({ title: "Document added!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setUploading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Documents</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5" disabled={readOnly}>
              <Plus className="h-4 w-4" /> Add Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Document</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Document Type *</Label>
                <Select value={form.document_type} onValueChange={(v) => setForm({ ...form, document_type: v })}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {DOC_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Document Number</Label><Input placeholder="POL-12345" value={form.document_number} onChange={(e) => setForm({ ...form, document_number: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Issue Date</Label><Input type="date" value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} /></div>
                <div className="space-y-2"><Label>Expiry Date</Label><Input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} /></div>
              </div>
              <div className="space-y-2">
                <Label>Upload File (PDF/Image)</Label>
                <Input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </div>
              <Button type="submit" className="w-full" disabled={uploading || createDoc.isPending || !form.document_type}>
                {uploading ? "Uploading..." : createDoc.isPending ? "Saving..." : "Add Document"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Card><CardContent className="h-32 animate-pulse p-4" /></Card>
      ) : (docs || []).length === 0 ? (
        <Card><CardContent className="flex flex-col items-center py-8"><FileText className="mb-2 h-8 w-8 text-muted-foreground/30" /><p className="text-sm text-muted-foreground">No documents yet</p></CardContent></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {(docs || []).map((doc) => (
            <Card key={doc.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{doc.document_type}</p>
                      {getExpiryBadge(doc.expiry_date)}
                    </div>
                    {doc.document_number && <p className="text-sm text-muted-foreground">#{doc.document_number}</p>}
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      {doc.issue_date && <span>Issued: {format(parseISO(doc.issue_date), "MMM dd, yyyy")}</span>}
                      {doc.expiry_date && <span>Expires: {format(parseISO(doc.expiry_date), "MMM dd, yyyy")}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {doc.file_url && (
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" className="h-8 w-8"><ExternalLink className="h-3.5 w-3.5" /></Button>
                      </a>
                    )}
                    {!readOnly && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteDoc.mutate({ id: doc.id, vehicleId })}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
