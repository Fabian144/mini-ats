import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Users, Briefcase } from 'lucide-react';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const { signIn, signUp, resetPassword, updatePassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
    const searchParams = new URLSearchParams(window.location.search);
    const type = hashParams.get('type') ?? searchParams.get('type');

    if (type === 'recovery') {
      setIsRecovery(true);
    }
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        title: 'Inloggning misslyckades',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      navigate('/dashboard');
    }

    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signUp(email, password, fullName);

    if (error) {
      toast({
        title: 'Registrering misslyckades',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Konto skapat!',
        description: 'Kontrollera din e-post för att verifiera kontot.',
      });
    }

    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      toast({
        title: 'Ange din e-post',
        description: 'Fyll i e-postadressen för att återställa lösenordet.',
        variant: 'destructive',
      });
      return;
    }

    setResetLoading(true);
    const { error } = await resetPassword(email.trim());

    if (error) {
      toast({
        title: 'Kunde inte skicka återställning',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'E-post skickad',
        description: 'Kontrollera din inkorg för återställningslänken.',
      });
    }

    setResetLoading(false);
  };

  const clearRecoveryUrl = () => {
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);

    url.hash = '';
    if (params.get('type') === 'recovery') {
      params.delete('type');
      url.search = params.toString() ? `?${params.toString()}` : '';
    }

    window.history.replaceState({}, '', url.toString());
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast({
        title: 'Lösenordet är för kort',
        description: 'Välj ett lösenord med minst 6 tecken.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Lösenorden matchar inte',
        description: 'Kontrollera att båda fälten har samma lösenord.',
        variant: 'destructive',
      });
      return;
    }

    setUpdatingPassword(true);
    const { error } = await updatePassword(newPassword);

    if (error) {
      toast({
        title: 'Kunde inte uppdatera lösenord',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Lösenord uppdaterat',
        description: 'Du kan nu logga in med ditt nya lösenord.',
      });
      clearRecoveryUrl();
      navigate('/dashboard');
    }

    setUpdatingPassword(false);
  };

  const handleExitRecovery = () => {
    setIsRecovery(false);
    setNewPassword('');
    setConfirmPassword('');
    clearRecoveryUrl();
  };
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">TalentTrack</h1>
          <p className="text-muted-foreground mt-2">Ditt smarta rekryteringsverktyg</p>
        </div>

        <Card className="glass-card">
          <CardHeader className="text-center pb-2">
            <CardTitle>{isRecovery ? 'Återställ lösenord' : 'Välkommen'}</CardTitle>
            <CardDescription>
              {isRecovery
                ? 'Välj ett nytt lösenord för ditt konto.'
                : 'Logga in eller skapa ett konto'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isRecovery ? (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nytt lösenord</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Minst 6 tecken"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Bekräfta lösenord</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Upprepa lösenordet"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={updatingPassword}>
                  {updatingPassword ? 'Uppdaterar...' : 'Uppdatera lösenord'}
                </Button>
                <Button type="button" variant="link" className="px-0" onClick={handleExitRecovery}>
                  Tillbaka till inloggning
                </Button>
              </form>
            ) : (
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Logga in</TabsTrigger>
                  <TabsTrigger value="register">Registrera konto</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">E-post</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="din@email.se"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Lösenord</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button
                      type="button"
                      variant="link"
                      className="px-0"
                      onClick={handleResetPassword}
                      disabled={resetLoading}
                    >
                      {resetLoading ? 'Skickar återställningslänk...' : 'Glömt lösenordet?'}
                    </Button>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Loggar in...' : 'Logga in'}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="register">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-name">Fullständigt namn</Label>
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="Anna Andersson"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-email">E-post</Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="din@email.se"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Lösenord</Label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="Minst 6 tecken"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Skapar konto...' : 'Skapa konto'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          <Briefcase className="inline w-4 h-4 mr-1" />
          Hantera kandidater enkelt och effektivt
        </p>
      </div>
    </div>
  );
}
