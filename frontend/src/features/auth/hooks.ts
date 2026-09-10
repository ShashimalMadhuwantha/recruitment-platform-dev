import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from './api';
import { useAuth } from '../../app/providers';
import {
  RegisterApplicantPayload,
  RegisterRecruiterPayload,
} from './types';

export const useLogin = () => {
  const { login } = useAuth();
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      if (!data.requiresMfa && data.tokens && data.user) {
        login(data.tokens.accessToken, data.tokens.refreshToken, data.user);
      }
    },
  });
};

export const useRegisterApplicant = () => {
  const { login } = useAuth();
  return useMutation({
    mutationFn: (data: RegisterApplicantPayload) => authApi.registerApplicant(data),
    onSuccess: (data) => {
      if (data.tokens && data.user) {
        login(data.tokens.accessToken, data.tokens.refreshToken, data.user);
      }
    },
  });
};

export const useRegisterRecruiter = () => {
  const { login } = useAuth();
  return useMutation({
    mutationFn: (data: RegisterRecruiterPayload) => authApi.registerRecruiter(data),
    onSuccess: (data) => {
      if (data.tokens && data.user) {
        login(data.tokens.accessToken, data.tokens.refreshToken, data.user);
      }
    },
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: authApi.forgotPassword,
  });
};

export const useResetPassword = () => {
  return useMutation({
    mutationFn: authApi.resetPassword,
  });
};

export const useMfaChallenge = () => {
  const { login } = useAuth();
  return useMutation({
    mutationFn: authApi.verifyMfaChallenge,
    onSuccess: (data) => {
      if (data.tokens && data.user) {
        login(data.tokens.accessToken, data.tokens.refreshToken, data.user);
      }
    },
  });
};

export const useCurrentUser = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.getMe,
    enabled: !!user,
  });
};
