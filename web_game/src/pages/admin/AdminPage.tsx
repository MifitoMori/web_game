import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Container,
  Group,
  Loader,
  Modal,
  Paper,
  ScrollArea,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Tabs,
  Text,
  TextInput,
  Textarea,
  ThemeIcon,
  Title,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconArrowBackUp,
  IconPackage,
  IconPencil,
  IconPlus,
  IconRefresh,
  IconShieldLock,
  IconTrash,
  IconUsers,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import {
  type AdminCatalogItem,
  type AdminRole,
  type CatalogFormValues,
  useAdmin,
} from '@hooks/useAdmin';

const roleOptions = [
  { value: 'USER', label: 'Пользователь' },
  { value: 'ADMIN', label: 'Админ' },
];

const getRoleLabel = (role: AdminRole) => {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'Супер-админ';
    case 'ADMIN':
      return 'Админ';
    default:
      return 'Пользователь';
  }
};

const rarityOptions = [
  { value: 'common', label: 'Обычная' },
  { value: 'rare', label: 'Редкая' },
  { value: 'epic', label: 'Эпическая' },
  { value: 'legendary', label: 'Легендарная' },
];

const typeOptions = [
  { value: 'skin', label: 'Скин' },
  { value: 'trail', label: 'След' },
  { value: 'title', label: 'Титул' },
];

const currencyOptions = [
  { value: 'credits', label: 'Кредиты' },
  { value: 'gems', label: 'Гемы' },
];

const defaultCatalogForm: CatalogFormValues = {
  slug: '',
  name: '',
  description: '',
  rarity: 'common',
  type: 'skin',
  price: 0,
  currency: 'credits',
};

type CatalogFormErrors = Partial<Record<keyof CatalogFormValues, string>>;

const slugLabel = (
  <Tooltip label="Человеко-понятный индентификатор" withArrow>
    <span>Слаг</span>
  </Tooltip>
);

const AdminPage = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const {
    users,
    catalogItems,
    isLoading,
    isSaving,
    refreshAdminPanel,
    updateUserRole,
    createCatalogItem,
    updateCatalogItem,
    deleteCatalogItem,
  } = useAdmin(currentUser?.role);

  const [selectedRoles, setSelectedRoles] = useState<Record<number, AdminRole>>({});
  const [opened, { open, close }] = useDisclosure(false);
  const [editingItem, setEditingItem] = useState<AdminCatalogItem | null>(null);
  const [catalogForm, setCatalogForm] = useState<CatalogFormValues>(defaultCatalogForm);
  const [catalogFormErrors, setCatalogFormErrors] = useState<CatalogFormErrors>({});

  useEffect(() => {
    setSelectedRoles(
      Object.fromEntries(users.map((user) => [user.id, user.role])) as Record<number, AdminRole>,
    );
  }, [currentUser?.role, users]);

  const ensureRoleValue = (userId: number): AdminRole => {
    return selectedRoles[userId] ?? 'USER';
  };

  const currentRoleLabel =
    currentUser?.role === 'SUPER_ADMIN'
      ? 'Супер-админ'
      : currentUser?.role === 'ADMIN'
        ? 'Админ'
        : 'Пользователь';

  const canEditRole = (user: { id: number; role: AdminRole }) => {
    if (!currentUser) {
      return false;
    }

    if (currentUser.id === user.id) {
      return false;
    }

    if (user.role === 'SUPER_ADMIN') {
      return false;
    }

    if (currentUser.role === 'SUPER_ADMIN') {
      return true;
    }

    return currentUser.role === 'ADMIN' && user.role === 'USER';
  };

  const stats = useMemo(
    () => ({
      totalUsers: users.length,
      totalAdmins: users.filter((user) => user.role !== 'USER').length,
      totalCatalogItems: catalogItems.length,
    }),
    [catalogItems.length, users],
  );

  const handleRoleSelect = (userId: number, value: string | null) => {
    if (!value) {
      return;
    }

    setSelectedRoles((current) => ({
      ...current,
      [userId]: value as AdminRole,
    }));
  };

  const changedRoleUsers = users.filter(
    (user) => canEditRole(user) && ensureRoleValue(user.id) !== user.role,
  );

  const roleManagementDescription =
    currentUser?.role === 'SUPER_ADMIN'
      ? 'Супер-админ может назначать роли Пользователь и Админ всем пользователям, кроме себя и других супер-админов.'
      : currentUser?.role === 'ADMIN'
        ? 'Админ может назначить роль Админ только обычным пользователям. Отменить такое изменение или понизить администратора может только супер-админ.'
        : 'У вашей роли нет прав на изменение ролей пользователей.';

  const handleSaveRoleChanges = async () => {
    for (const user of changedRoleUsers) {
      await updateUserRole(user.id, ensureRoleValue(user.id));
    }
  };

  const handleCatalogFieldChange = (
    field: keyof CatalogFormValues,
    value: string | number,
  ) => {
    const nextValue = field === 'price' ? Number(value) : value;

    setCatalogForm((current) => ({
      ...current,
      [field]: nextValue,
    }));

    setCatalogFormErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const validateCatalogForm = () => {
    const nextErrors: CatalogFormErrors = {};
    const slug = catalogForm.slug.trim();
    const name = catalogForm.name.trim();
    const description = catalogForm.description.trim();

    if (slug.length < 3) {
      nextErrors.slug = 'Слаг должен содержать минимум 3 символа';
    } else if (slug.length > 100) {
      nextErrors.slug = 'Слаг не должен быть длиннее 100 символов';
    }

    if (!name) {
      nextErrors.name = 'Введите название товара';
    }

    if (!description) {
      nextErrors.description = 'Введите описание товара';
    }

    if (!Number.isFinite(catalogForm.price) || catalogForm.price <= 0) {
      nextErrors.price = 'Цена должна быть больше 0';
    }

    if (!catalogForm.rarity) {
      nextErrors.rarity = 'Выберите редкость';
    }

    if (!catalogForm.type) {
      nextErrors.type = 'Выберите категорию';
    }

    if (!catalogForm.currency) {
      nextErrors.currency = 'Выберите валюту';
    }

    setCatalogFormErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const resetCatalogModalState = () => {
    setEditingItem(null);
    setCatalogForm(defaultCatalogForm);
    setCatalogFormErrors({});
    close();
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setCatalogForm(defaultCatalogForm);
    setCatalogFormErrors({});
    open();
  };

  const openEditModal = (item: AdminCatalogItem) => {
    setEditingItem(item);
    setCatalogForm({
      slug: item.slug,
      name: item.name,
      description: item.description,
      rarity: item.rarity,
      type: item.type,
      price: item.price,
      currency: item.currency,
    });
    setCatalogFormErrors({});
    open();
  };

  const handleSubmitCatalogForm = async () => {
    if (!validateCatalogForm()) {
      return;
    }

    if (editingItem) {
      await updateCatalogItem(editingItem.id, catalogForm);
    } else {
      await createCatalogItem(catalogForm);
    }

    resetCatalogModalState();
  };

  if (isLoading) {
    return (
      <Container size="xl" py="xl">
        <Group justify="center" py="xl">
          <Loader size="lg" />
        </Group>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Modal
        opened={opened}
        onClose={resetCatalogModalState}
        title={editingItem ? 'Редактирование товара' : 'Новый товар'}
        centered
        size="xl"
      >
        <Stack gap="sm">
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm" verticalSpacing="sm">
            <TextInput
              label={slugLabel}
              value={catalogForm.slug}
              error={catalogFormErrors.slug}
              onChange={(event) => handleCatalogFieldChange('slug', event.currentTarget.value)}
            />
            <TextInput
              label="Название"
              value={catalogForm.name}
              error={catalogFormErrors.name}
              onChange={(event) => handleCatalogFieldChange('name', event.currentTarget.value)}
            />
            <Select
              label="Редкость"
              value={catalogForm.rarity}
              data={rarityOptions}
              allowDeselect={false}
              error={catalogFormErrors.rarity}
              onChange={(value) => value && handleCatalogFieldChange('rarity', value)}
            />
            <Select
              label="Категория"
              value={catalogForm.type}
              data={typeOptions}
              allowDeselect={false}
              error={catalogFormErrors.type}
              onChange={(value) => value && handleCatalogFieldChange('type', value)}
            />
            <TextInput
              label="Цена"
              type="number"
              min={1}
              value={catalogForm.price.toString()}
              error={catalogFormErrors.price}
              onChange={(event) => handleCatalogFieldChange('price', event.currentTarget.value)}
            />
            <Select
              label="Валюта"
              value={catalogForm.currency}
              data={currencyOptions}
              allowDeselect={false}
              error={catalogFormErrors.currency}
              onChange={(value) => value && handleCatalogFieldChange('currency', value)}
            />
          </SimpleGrid>

          <Textarea
            label="Описание"
            minRows={3}
            autosize
            value={catalogForm.description}
            error={catalogFormErrors.description}
            onChange={(event) =>
              handleCatalogFieldChange('description', event.currentTarget.value)
            }
          />

          <Group justify="flex-end">
            <Button variant="default" onClick={resetCatalogModalState}>
              Отмена
            </Button>
            <Button onClick={() => void handleSubmitCatalogForm()} loading={isSaving}>
              {editingItem ? 'Сохранить' : 'Создать'}
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={1}>Админ-панель</Title>
            <Text c="dimmed">
              Управление пользователями и каталогом магазина из одного интерфейса.
            </Text>
            <Badge
              mt="sm"
              variant="light"
              color={currentUser?.role === 'SUPER_ADMIN' ? 'red' : 'orange'}
            >
              Ваша роль: {currentRoleLabel}
            </Badge>
          </div>
          <Group>
            <Button
              variant="default"
              leftSection={<IconArrowBackUp size={18} />}
              onClick={() => navigate('/lobby')}
            >
              В лобби
            </Button>
            <Button
              variant="light"
              leftSection={<IconRefresh size={18} />}
              onClick={() => void refreshAdminPanel()}
              loading={isLoading}
            >
              Обновить
            </Button>
          </Group>
        </Group>

        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
          <Card withBorder radius="lg" p="lg">
            <Group justify="space-between">
              <div>
                <Text size="sm" c="dimmed">
                  Пользователи
                </Text>
                <Title order={2}>{stats.totalUsers}</Title>
              </div>
              <ThemeIcon size={42} radius="md" variant="light" color="blue">
                <IconUsers size={22} />
              </ThemeIcon>
            </Group>
          </Card>
          <Card withBorder radius="lg" p="lg">
            <Group justify="space-between">
              <div>
                <Text size="sm" c="dimmed">
                  Администраторы
                </Text>
                <Title order={2}>{stats.totalAdmins}</Title>
              </div>
              <ThemeIcon size={42} radius="md" variant="light" color="orange">
                <IconShieldLock size={22} />
              </ThemeIcon>
            </Group>
          </Card>
          <Card withBorder radius="lg" p="lg">
            <Group justify="space-between">
              <div>
                <Text size="sm" c="dimmed">
                  Товары в каталоге
                </Text>
                <Title order={2}>{stats.totalCatalogItems}</Title>
              </div>
              <ThemeIcon size={42} radius="md" variant="light" color="teal">
                <IconPackage size={22} />
              </ThemeIcon>
            </Group>
          </Card>
        </SimpleGrid>

        <Tabs defaultValue="users" keepMounted={false}>
          <Tabs.List>
            <Tabs.Tab value="users" leftSection={<IconUsers size={16} />}>
              Пользователи
            </Tabs.Tab>
            <Tabs.Tab value="catalog" leftSection={<IconPackage size={16} />}>
              Каталог
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="users" pt="md">
            <Stack gap="md">
              <Group justify="space-between" align="flex-start">
                <div>
                  <Title order={3}>Пользователи</Title>
                  <Text c="dimmed" size="sm">
                    {roleManagementDescription}
                  </Text>
                </div>
                <Button
                  onClick={() => void handleSaveRoleChanges()}
                  loading={isSaving}
                  disabled={changedRoleUsers.length === 0 || isSaving}
                >
                  Сохранить изменения
                </Button>
              </Group>
              <Paper withBorder radius="lg" p="lg">
                <ScrollArea>
                  <Table striped highlightOnHover withTableBorder>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>ID</Table.Th>
                        <Table.Th>Имя</Table.Th>
                        <Table.Th>Логин</Table.Th>
                        <Table.Th>Email</Table.Th>
                        <Table.Th>Дата регистрации</Table.Th>
                        <Table.Th>Роль</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {users.map((user) => (
                        <Table.Tr key={user.id}>
                          <Table.Td>{user.id}</Table.Td>
                          <Table.Td>
                            {user.firstName} {user.secondName}
                          </Table.Td>
                          <Table.Td>{user.login}</Table.Td>
                          <Table.Td>{user.email}</Table.Td>
                          <Table.Td>{dayjs(user.createdAt).format('DD.MM.YYYY')}</Table.Td>
                          <Table.Td>
                            {user.role === 'SUPER_ADMIN' ? (
                              <Badge color="red" variant="light">
                                {getRoleLabel(user.role)}
                              </Badge>
                            ) : (
                              <Select
                                data={roleOptions}
                                value={ensureRoleValue(user.id)}
                                onChange={(value) => handleRoleSelect(user.id, value)}
                                allowDeselect={false}
                                disabled={!canEditRole(user)}
                              />
                            )}
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </ScrollArea>
              </Paper>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="catalog" pt="md">
            <Stack gap="md">
              <Group justify="space-between">
                <div>
                  <Title order={3}>Товары каталога</Title>
                  <Text c="dimmed" size="sm">
                    Создавайте, обновляйте и удаляйте позиции магазина.
                  </Text>
                </div>
                <Button leftSection={<IconPlus size={18} />} onClick={openCreateModal}>
                  Новый товар
                </Button>
              </Group>

              <Paper withBorder radius="lg" p="lg">
                <ScrollArea>
                  <Table striped highlightOnHover withTableBorder>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>ID</Table.Th>
                        <Table.Th>Название</Table.Th>
                        <Table.Th>{slugLabel}</Table.Th>
                        <Table.Th>Категория</Table.Th>
                        <Table.Th>Редкость</Table.Th>
                        <Table.Th>Цена</Table.Th>
                        <Table.Th>Валюта</Table.Th>
                        <Table.Th>Действия</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {catalogItems.map((item) => (
                        <Table.Tr key={item.id}>
                          <Table.Td>{item.id}</Table.Td>
                          <Table.Td>
                            <Stack gap={2}>
                              <Text fw={600}>{item.name}</Text>
                              <Text size="sm" c="dimmed">
                                {item.description}
                              </Text>
                            </Stack>
                          </Table.Td>
                          <Table.Td>{item.slug}</Table.Td>
                          <Table.Td>
                            <Badge variant="light">{item.type}</Badge>
                          </Table.Td>
                          <Table.Td>{item.rarity}</Table.Td>
                          <Table.Td>{item.price}</Table.Td>
                          <Table.Td>{item.currency}</Table.Td>
                          <Table.Td>
                            <Group gap="xs" wrap="nowrap">
                              <ActionIcon
                                variant="light"
                                color="blue"
                                onClick={() => openEditModal(item)}
                              >
                                <IconPencil size={16} />
                              </ActionIcon>
                              <ActionIcon
                                variant="light"
                                color="red"
                                onClick={() => void deleteCatalogItem(item.id)}
                              >
                                <IconTrash size={16} />
                              </ActionIcon>
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </ScrollArea>
              </Paper>
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
};

export default AdminPage;
