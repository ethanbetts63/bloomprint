"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, MapPin, Calendar, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { getDeliveryRequestByToken, respondToDeliveryRequest, markDeliveryComplete } from '@/api/partners';
import type { DeliveryRequestDetail } from '@/types';
import { errorMessage } from '@/lib/errors';

const DeliveryRequestPage = () => {
  const params = useParams();
  const token = params.token as string | undefined;
  const [request, setRequest] = useState<DeliveryRequestDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isResponding, setIsResponding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    const fetchRequest = async () => {
      try {
        const data = await getDeliveryRequestByToken(token);
        setRequest(data);
      } catch (err) {
        setError(errorMessage(err) || 'Delivery request not found.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchRequest();
  }, [token]);

  const handleRespond = async (action: 'accept' | 'decline') => {
    if (!token) return;
    setIsResponding(true);
    try {
      await respondToDeliveryRequest(token, action);
      toast.success(action === 'accept' ? 'Delivery accepted!' : 'Delivery declined.');
      const data = await getDeliveryRequestByToken(token);
      setRequest(data);
    } catch (err) {
      toast.error('Failed to respond', { description: errorMessage(err) });
    } finally {
      setIsResponding(false);
    }
  };

  const handleMarkDelivered = async () => {
    if (!token) return;
    setIsResponding(true);
    try {
      await markDeliveryComplete(token);
      toast.success('Marked as delivered!');
      const data = await getDeliveryRequestByToken(token);
      setRequest(data);
    } catch (err) {
      toast.error('Failed to mark as delivered', { description: errorMessage(err) });
    } finally {
      setIsResponding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner className="h-12 w-12" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500">{error || 'Not found.'}</p>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen w-full py-0 md:py-12 px-0 md:px-4" style={{ backgroundColor: 'var(--surface-beige)' }}>
        <div className="container mx-auto max-w-4xl space-y-6">
          <Card className="bg-white text-black border-none shadow-none md:shadow-xl md:shadow-black/5 rounded-none md:rounded-[2rem] overflow-hidden">
            <CardHeader className="px-4 md:px-8">
              <div className="flex items-center justify-between">
                <CardTitle className="text-3xl md:text-4xl font-bold font-playfair-display">Delivery Request</CardTitle>
                <Badge variant="outline" className="text-sm capitalize">{request.status}</Badge>
              </div>
              <CardDescription>Review the delivery details below.</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 px-4 md:px-8">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Delivery Date</p>
                  <p className="font-semibold">{request.delivery_date}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Delivery Location</p>
                  <p className="font-semibold">{request.recipient_name}</p>
                  <p className="text-sm">
                    {[request.recipient_suburb, request.recipient_city, request.recipient_state, request.recipient_postcode]
                      .filter(Boolean).join(', ')}
                  </p>
                  <p className="text-sm">{request.recipient_country}</p>
                </div>
              </div>

              {request.budget && (
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Budget</p>
                    <p className="font-semibold">${Number(request.budget).toFixed(2)}</p>
                  </div>
                </div>
              )}

              {request.delivery_notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Delivery Notes</p>
                  <p className="text-sm mt-1">{request.delivery_notes}</p>
                </div>
              )}

              {request.message && (
                <div>
                  <p className="text-sm text-muted-foreground">Card Message</p>
                  <p className="text-sm mt-1 italic">"{request.message}"</p>
                </div>
              )}

              {request.status === 'pending' && (
                <div className="flex gap-4 pt-4 border-t">
                  <Button
                    className="flex-1"
                    onClick={() => handleRespond('accept')}
                    disabled={isResponding}
                  >
                    {isResponding ? <Spinner className="h-4 w-4 mr-2 text-current" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                    Accept
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleRespond('decline')}
                    disabled={isResponding}
                  >
                    {isResponding ? <Spinner className="h-4 w-4 mr-2 text-current" /> : <XCircle className="h-4 w-4 mr-2" />}
                    Decline
                  </Button>
                </div>
              )}

              {request.status === 'accepted' && request.event_status !== 'delivered' && request.event_status !== 'completed' && (
                <div className="pt-4 border-t">
                  <Button
                    className="w-full"
                    onClick={handleMarkDelivered}
                    disabled={isResponding}
                  >
                    {isResponding ? <Spinner className="h-4 w-4 mr-2 text-current" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                    Mark as Delivered
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default DeliveryRequestPage;
