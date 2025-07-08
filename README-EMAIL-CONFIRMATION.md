# Email Confirmation Functionality

## Восстановленная функциональность

Поле `is_email_confirmed` и логика с MailService были восстановлены. Поле `email_confirm_token` НЕ восстановлено, так как оно не используется.

## Что было добавлено

### 1. Миграция
- **Файл**: `1753000000000-RestoreEmailConfirmation.ts`
- **Действие**: Добавляет поле `is_email_confirmed` в таблицу `users`
- **Запуск**: `npm run migration:run`

### 2. User Entity
- Добавлено поле `is_email_confirmed: boolean` (по умолчанию `false`)

### 3. Users Service
- `confirmEmail(email: string)` - подтверждение email
- `isEmailConfirmed(email: string)` - проверка статуса подтверждения
- `sendConfirmationEmail(email: string)` - подготовка к отправке письма
- Обновлены методы `getUserFullInfo` и `getBasicInfo` для включения статуса подтверждения
- Статистика регистраций теперь включает количество подтвержденных email

### 4. Auth Controller
- **POST `/auth/confirm-email`** - подтверждение email
- **POST `/auth/resend-confirmation`** - повторная отправка письма подтверждения
- Интеграция с MailService для автоматической отправки писем при регистрации
- Все методы теперь возвращают статус `isEmailConfirmed`

### 5. MailService
- Интегрирован в AuthController
- Автоматическая отправка писем подтверждения при регистрации

## API Endpoints

### Подтверждение Email
```http
POST /auth/confirm-email
Content-Type: application/json

{
  "email": "user@example.com",
  "token": "optional-token"
}
```

### Повторная отправка письма подтверждения
```http
POST /auth/resend-confirmation
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### Проверка статуса email
```http
GET /auth/check-email?email=user@example.com
```

Ответ:
```json
{
  "exists": true,
  "roles": ["student"],
  "isEmailConfirmed": false
}
```

## Как работает

1. **Регистрация**: Новый пользователь создается с `is_email_confirmed: false`
2. **Отправка письма**: Автоматически отправляется письмо подтверждения
3. **Подтверждение**: Пользователь переходит по ссылке и вызывается `/auth/confirm-email`
4. **Обновление**: Поле `is_email_confirmed` устанавливается в `true`

## Переменные окружения

Убедитесь, что настроены переменные для SMTP:
```env
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## Запуск миграции

```bash
cd services/auth-service
npm run migration:run
```

## Логирование

Все операции с email confirmation логируются:
- Отправка писем подтверждения
- Успешные подтверждения
- Ошибки отправки/подтверждения

## Статистика

Метод `getUserRegistrationStats` теперь включает:
- `newStudents` - количество новых студентов
- `newTeachers` - количество новых преподавателей  
- `confirmedEmails` - количество подтвержденных email адресов 