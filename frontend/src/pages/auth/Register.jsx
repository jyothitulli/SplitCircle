import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '../../components/forms/FormField';
import { Button } from '../../components/ui/Button';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { InstallAppButton } from '../../components/ui/InstallAppButton';
import { AuroraBackground } from '../../components/effects/AuroraBackground';
import { CursorGlow } from '../../components/effects/CursorGlow';
import { TiltCard, Magnetic } from '../../components/effects/Interactive';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import { IconLock, IconMail, IconUser } from '../../components/icons';

export function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const { mutate, isPending } = useMutation({
    mutationFn: authAPI.register,
    onSuccess: ({ data }) => {
      login(data.data.user, data.data.token);
      toast.success('Account created');
      navigate('/dashboard');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Registration failed'),
  });

  return (
    <div className="relative min-h-screen overflow-hidden bg-bg text-ink">
      <AuroraBackground variant="hero" />
      <CursorGlow />
      <div className="absolute right-5 top-5 z-10 flex items-center gap-2">
        <InstallAppButton />
        <ThemeToggle />
      </div>

      <div className="relative mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-6 py-10 lg:grid-cols-[1.05fr_440px]">
        <motion.section
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="hidden lg:block"
        >
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-[0_18px_40px_-18px_rgb(var(--primary-500)/0.75)]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="9" cy="9" r="6.2" stroke="white" strokeWidth="1.8" />
                <circle cx="15" cy="15" r="6.2" stroke="rgb(var(--secondary-500))" strokeWidth="1.8" />
              </svg>
            </div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-600">SplitCircle</p>
          </div>
          <h1 className="font-display text-5xl font-semibold leading-[1.08] tracking-tight text-ink">
            Create a <span className="text-aurora-animate">calmer</span> way to split.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted">
            Build circles for friends, roommates, teams, and trips with balances that stay understandable.
          </p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="mt-10"
          >
            <TiltCard max={4}>
              <div className="glass gradient-ring rounded-2xl p-6">
                <p className="text-sm font-semibold text-ink">Crafted for daily clarity</p>
                <p className="mt-3 text-sm leading-6 text-muted">
                  Authentication, protected routes, smart settlements, OCR drafts, and AI insights all live in one calm workspace.
                </p>
              </div>
            </TiltCard>
          </motion.div>
        </motion.section>

        <motion.main
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="w-full"
        >
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-[0_18px_40px_-18px_rgb(var(--primary-500)/0.75)]">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <circle cx="9" cy="9" r="6.2" stroke="white" strokeWidth="1.8" />
                <circle cx="15" cy="15" r="6.2" stroke="rgb(var(--secondary-500))" strokeWidth="1.8" />
              </svg>
            </div>
            <h1 className="font-display text-3xl font-semibold text-ink">SplitCircle</h1>
          </div>

          <div className="glass gradient-ring is-active rounded-xl3 p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="font-display text-2xl font-semibold text-ink">Create account</h2>
              <p className="mt-1 text-sm text-muted">Set up your account in a minute.</p>
            </div>

            <form onSubmit={handleSubmit(mutate)} className="space-y-5">
              <Input
                label="Full name"
                icon={<IconUser size={17} />}
                placeholder="Jane Doe"
                error={errors.name?.message}
                {...register('name', { required: 'Name is required' })}
              />
              <Input
                label="Email"
                type="email"
                icon={<IconMail size={17} />}
                placeholder="you@example.com"
                error={errors.email?.message}
                {...register('email', { required: 'Email is required' })}
              />
              <Input
                label="Password"
                type="password"
                icon={<IconLock size={17} />}
                placeholder="At least 8 characters"
                error={errors.password?.message}
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Use at least 8 characters' },
                })}
              />
              <Magnetic strength={0.2} className="block w-full">
                <Button type="submit" loading={isPending} className="w-full py-3 text-base">
                  {isPending ? 'Creating account…' : 'Create account'}
                </Button>
              </Magnetic>
            </form>

            <p className="mt-6 text-center text-sm text-muted">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">
                Sign in
              </Link>
            </p>
          </div>
        </motion.main>
      </div>
    </div>
  );
}
