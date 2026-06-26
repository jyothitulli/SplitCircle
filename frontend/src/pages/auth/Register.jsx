import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/forms/FormField';

export function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();

  const { mutate, isPending } = useMutation({
    mutationFn: authAPI.register,
    onSuccess: ({ data }) => {
      login(data.data.user, data.data.token);
      toast.success('Account created!');
      navigate('/dashboard');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Registration failed'),
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">S</div>
          <h1 className="text-3xl font-bold text-slate-100">Create account</h1>
          <p className="text-slate-400 mt-2">Start splitting expenses smarter</p>
        </div>

        <div className="glass rounded-2xl p-8">
          <form onSubmit={handleSubmit(mutate)} className="space-y-5">
            <Input label="Full Name" placeholder="Jane Doe"
              error={errors.name?.message}
              {...register('name', { required: 'Name is required' })} />
            <Input label="Email" type="email" placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email', { required: 'Email is required' })} />
            <Input label="Password" type="password" placeholder="••••••••"
              error={errors.password?.message}
              {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Min 8 characters' } })} />
            <button type="submit" disabled={isPending} className="btn-primary w-full py-3 text-base">
              {isPending ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
