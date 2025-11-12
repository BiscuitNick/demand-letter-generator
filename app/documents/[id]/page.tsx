import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadTab } from "./upload-tab";
import { FactsTab } from "./facts-tab";
import { OutlineTab } from "./outline-tab";
import { DraftTab } from "./draft-tab";

interface DocumentPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function DocumentPage({ params }: DocumentPageProps) {
  const { id } = await params;

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Demand Letter Workflow</h1>
        <p className="text-muted-foreground">
          Follow the steps to create your demand letter: Upload → Facts → Outline → Draft
        </p>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="facts">Facts</TabsTrigger>
          <TabsTrigger value="outline">Outline</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <UploadTab docId={id} />
        </TabsContent>

        <TabsContent value="facts" className="space-y-4">
          <FactsTab docId={id} />
        </TabsContent>

        <TabsContent value="outline" className="space-y-4">
          <OutlineTab docId={id} />
        </TabsContent>

        <TabsContent value="draft" className="space-y-4">
          <DraftTab docId={id} />
        </TabsContent>

      </Tabs>
    </div>
  );
}
