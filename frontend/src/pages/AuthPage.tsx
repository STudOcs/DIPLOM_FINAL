import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

interface AuthForm {
  email: string;
  password: string;
  fullName?: string;
}

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { register, handleSubmit, formState: { errors } } = useForm<AuthForm>();

  const onSubmit = (data: AuthForm) => {
    console.log('Auth data:', data);
    // TODO: API call for authentication
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {isLogin ? 'Вход в систему' : 'Регистрация'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Редактор документов учебной деятельности СФУ
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {!isLogin && (
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                  ФИО
                </label>
                <input
                  {...register("fullName", { required: !isLogin })}
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                {...register("email", { 
                  required: true,
                  pattern: /^\S+@\S+$/i 
                })}
                type="email"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
              {errors.email && <span className="text-red-500 text-xs">Введите корректный email</span>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Пароль
              </label>
              <input
                {...register("password", { required: true, minLength: 6 })}
                type="password"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
              {errors.password && <span className="text-red-500 text-xs">Минимум 6 символов</span>}
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                {isLogin ? 'Войти' : 'Зарегистрироваться'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="w-full text-center text-sm text-blue-600 hover:text-blue-500"
            >
              {isLogin ? 'Нет аккаунта? Зарегистрируйтесь' : 'Уже есть аккаунт? Войдите'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;