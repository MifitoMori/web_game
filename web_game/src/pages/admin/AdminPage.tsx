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
import {
  type AdminCatalogItem,
  type AdminRole,
  type CatalogFormValues,
  useAdmin,
} from '@hooks/useAdmin';
import { useAuth } from '@hooks/useAuth';

const roleOptions = [
  { value: 'USER', label: 'USER' },
  { value: 'ADMIN', label: 'ADMIN' },
];

const rarityOptions = [
  { value: 'common', label: 'Обычная' },
  { value: 'rare', label: 'Редкая' },
  { value: 'epic', label: 'Эпическая' },
  { value: 'legendary', label: 'Легендарная' },
];

const typeOptions = [
  { value: 'skin', label: 'Скин' },
  { value: 'trail', label: 'Трейл' },
  { value: 'effect', label: 'Эффект' },
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

const AdminPage = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const {
    users,
    catalogItems,
    isLoading,
    isSaving,
    refreshData,
    updateUserRole,
    createCatalogItem,
    updateCatalogItem,
    deleteCatalogItem,
  } = useAdmin();
  const [selectedRoles, setSelectedRoles] = useState<Record<number, AdminRole>>({});
  const [opened, { open, close }] = useDisclosure(false);
  const [editingItem, setEditingItem] = useState<AdminCatalogItem | null>(null);
  const [catalogForm, setCatalogForm] = useState<CatalogFormValues>(defaultCatalogForm);

  useEffect(() => {
    setSelectedRoles(
      Object.fromEntries(users.map((user) => [user.id, user.role])) as Record<number, AdminRole>,
    );
  }, [users]);

  const ensureRoleValue = (userId: number): AdminRole => {
    return selectedRoles[userId] ?? 'USER';
  };

  const stats = useMemo(
    () => ({
      totalUsers: users.length,
      totalAdmins: users.filter((user) => ensureRoleValue(user.id) === 'ADMIN').length,
      totalCatalogItems: catalogItems.length,
    }),
    [catalogItems.length, selectedRoles, users],
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

  const handleCatalogFieldChange = (
    field: keyof CatalogFormValues,
    value: string | number,
  ) => {
    setCatalogForm((current) => ({
      ...current,
      [field]: field === 'price' ? Number(value) : value,
    }));
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setCatalogForm(defaultCatalogForm);
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
    open();
  };

  const handleSubmitCatalogForm = async () => {
    if (editingItem) {
      await updateCatalogItem(editingItem.id, catalogForm);
    } else {
      await createCatalogItem(catalogForm);
    }

    close();
    setEditingItem(null);
    setCatalogForm(defaultCatalogForm);
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
        onClose={close}
        title={editingItem ? 'Редактирование товара' : 'Новый товар'}
        centered
        styles={{
          body: {
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          },
        }}
      >
        <Stack gap="xs">
          <TextInput
            label="Slug"
            value={catalogForm.slug}
            onChange={(event) => handleCatalogFieldChange('slug', event.currentTarget.value)}
          />
          <TextInput
            label="Название"
            value={catalogForm.name}
            onChange={(event) => handleCatalogFieldChange('name', event.currentTarget.value)}
          />
          <Textarea
            label="Описание"
            minRows={3}
            value={catalogForm.description}
            onChange={(event) =>
              handleCatalogFieldChange('description', event.currentTarget.value)
            }
          />
          <Select
            label="Редкость"
            value={catalogForm.rarity}
            data={rarityOptions}
            allowDeselect={false}
            onChange={(value) => value && handleCatalogFieldChange('rarity', value)}
          />
          <Select
            label="Категория"
            value={catalogForm.type}
            data={typeOptions}
            allowDeselect={false}
            onChange={(value) => value && handleCatalogFieldChange('type', value)}
          />
          <TextInput
            label="Цена"
            type="number"
            value={catalogForm.price.toString()}
            onChange={(event) => handleCatalogFieldChange('price', event.currentTarget.value)}
          />
          <Select
            label="Валюта"
            value={catalogForm.currency}
            data={currencyOptions}
            allowDeselect={false}
            onChange={(value) => value && handleCatalogFieldChange('currency', value)}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={close}>
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
              onClick={() => void refreshData()}
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
                      <Table.Th>Действие</Table.Th>
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
                          <Select
                            data={roleOptions}
                            value={ensureRoleValue(user.id)}
                            onChange={(value) => handleRoleSelect(user.id, value)}
                            allowDeselect={false}
                            disabled={currentUser?.id === user.id}
                          />
                        </Table.Td>
                        <Table.Td>
                          <Button
                            size="xs"
                            onClick={() =>
                              void updateUserRole(user.id, ensureRoleValue(user.id))
                            }
                            loading={isSaving}
                            disabled={currentUser?.id === user.id}
                          >
                            {currentUser?.id === user.id ? 'Недоступно' : 'Сохранить'}
                          </Button>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            </Paper>
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
                        <Table.Th>Slug</Table.Th>
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
