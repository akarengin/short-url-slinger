import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Copy, ExternalLink, QrCode, BarChart3, Link2, Zap } from "lucide-react";

interface ShortenedURL {
  id: string;
  originalUrl: string;
  shortUrl: string;
  shortCode: string;
  customAlias?: string;
  clicks: number;
  createdAt: Date;
}

export const URLShortener = () => {
  const [url, setUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [shortenedUrls, setShortenedUrls] = useState<ShortenedURL[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const generateShortCode = (length: number = 6) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  const handleShorten = async () => {
    if (!url.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a URL to shorten",
        variant: "destructive",
      });
      return;
    }

    if (!isValidUrl(url)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL (include http:// or https://)",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const shortCode = customAlias || generateShortCode();
    const shortUrl = `https://short.ly/${shortCode}`;
    
    const newShortenedUrl: ShortenedURL = {
      id: Math.random().toString(36).substr(2, 9),
      originalUrl: url,
      shortUrl,
      shortCode,
      customAlias: customAlias || undefined,
      clicks: 0,
      createdAt: new Date(),
    };

    setShortenedUrls(prev => [newShortenedUrl, ...prev]);
    setUrl("");
    setCustomAlias("");
    setIsLoading(false);

    toast({
      title: "URL Shortened Successfully!",
      description: "Your short URL is ready to use",
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "URL copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy URL to clipboard",
        variant: "destructive",
      });
    }
  };

  const simulateClick = (id: string) => {
    setShortenedUrls(prev => 
      prev.map(url => 
        url.id === id 
          ? { ...url, clicks: url.clicks + 1 }
          : url
      )
    );
    toast({
      title: "Link Clicked",
      description: "Analytics updated",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-primary">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-3 bg-primary/20 rounded-xl">
              <Link2 className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-accent bg-clip-text text-transparent">
              ShortLink
            </h1>
          </div>
          <p className="text-xl text-foreground/80 max-w-2xl mx-auto">
            Transform long URLs into powerful, trackable short links. Perfect for social media, marketing campaigns, and anywhere you need clean, professional links.
          </p>
        </div>

        {/* URL Shortener Form */}
        <Card className="max-w-4xl mx-auto mb-8 bg-card/50 backdrop-blur-sm border-border/50 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Shorten Your URL
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                placeholder="Enter your long URL here (e.g., https://example.com/very/long/url)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1 bg-background/50"
              />
              <Input
                placeholder="Custom alias (optional)"
                value={customAlias}
                onChange={(e) => setCustomAlias(e.target.value)}
                className="md:w-48 bg-background/50"
              />
              <Button 
                onClick={handleShorten}
                disabled={isLoading}
                className="bg-gradient-primary hover:bg-gradient-accent transition-all duration-300 shadow-glow"
              >
                {isLoading ? "Shortening..." : "Shorten URL"}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Create memorable short links with optional custom aliases for your brand
            </p>
          </CardContent>
        </Card>

        {/* Recent Links */}
        {shortenedUrls.length > 0 && (
          <Card className="max-w-4xl mx-auto bg-card/50 backdrop-blur-sm border-border/50 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Your Links ({shortenedUrls.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {shortenedUrls.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-lg bg-background/30 border border-border/50 transition-all duration-300 hover:bg-background/50"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-medium text-primary truncate">
                          {item.shortUrl}
                        </p>
                        {item.customAlias && (
                          <Badge variant="secondary" className="text-xs">
                            Custom
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {item.originalUrl}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Created: {item.createdAt.toLocaleDateString()}</span>
                        <span className="flex items-center gap-1">
                          <BarChart3 className="h-3 w-3" />
                          {item.clicks} clicks
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(item.shortUrl)}
                        className="bg-background/50 hover:bg-primary/20"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => simulateClick(item.id)}
                        className="bg-background/50 hover:bg-primary/20"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toast({
                          title: "QR Code",
                          description: "QR code generation coming soon!",
                        })}
                        className="bg-background/50 hover:bg-primary/20"
                      >
                        <QrCode className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Features */}
        <div className="max-w-4xl mx-auto mt-12 grid md:grid-cols-3 gap-6">
          <Card className="bg-card/30 backdrop-blur-sm border-border/50 hover:bg-card/50 transition-all duration-300">
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-primary/20 rounded-xl w-fit mx-auto mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Analytics</h3>
              <p className="text-sm text-muted-foreground">
                Track clicks and performance of your short links
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-card/30 backdrop-blur-sm border-border/50 hover:bg-card/50 transition-all duration-300">
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-primary/20 rounded-xl w-fit mx-auto mb-4">
                <Link2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Custom Links</h3>
              <p className="text-sm text-muted-foreground">
                Create branded short links with custom aliases
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-card/30 backdrop-blur-sm border-border/50 hover:bg-card/50 transition-all duration-300">
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-primary/20 rounded-xl w-fit mx-auto mb-4">
                <QrCode className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">QR Codes</h3>
              <p className="text-sm text-muted-foreground">
                Generate QR codes for easy mobile sharing
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};