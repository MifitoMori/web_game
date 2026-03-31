import React, { useState } from 'react';
import { 
  Paper, 
  Title, 
  Text, 
  Group, 
  Avatar, 
  Badge, 
  ScrollArea,
  TextInput,
  ActionIcon,
  Menu,
  Indicator,
  Stack,
  Divider,
  Tooltip, 
  Button
} from '@mantine/core';
import { 
  IconSearch, 
  IconDotsVertical,
  IconMessage,
  IconPlayerPlay,
  IconUserPlus,
  IconUserMinus,
  IconUsers
} from '@tabler/icons-react';
import type { Friend } from '@types/lobby';
import classes from './FriendsList.module.css';

interface FriendsListProps {
  friends: Friend[];
}

const FriendsList: React.FC<FriendsListProps> = ({ friends }) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredFriends = friends.filter(friend =>
    friend.nickname.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Paper className={classes.friendsList} radius="md" withBorder>
      {/* Заголовок */}
      <Group justify="space-between" mb="md">
        <Group>
          <IconUsers size={24} />
          <Title order={3}>Друзья</Title>
        </Group>
        <Badge size="lg" variant="filled" color="blue">
          {friends.length} всего
        </Badge>
      </Group>

      {/* Поиск */}
      <TextInput
        placeholder="Поиск друзей..."
        leftSection={<IconSearch size={16} />}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        mb="md"
      />

      {/* Список друзей */}
      <ScrollArea className={classes.scrollArea} type="always">
        <Stack gap="xs">
          {filteredFriends.map((friend) => (
            <Paper 
              key={friend.id} 
              className={classes.friendItem}
              withBorder
              p="xs"
            >
              <Group justify="space-between" wrap="nowrap">
                <Group wrap="nowrap" style={{ flex: 1 }}>
                  {/* Индикатор статуса */}
                  <Indicator
                    position="bottom-end"
                    size={12}
                    offset={7}
                    withBorder
                  >
                    <Avatar 
                      src={friend.avatar} 
                      size={40} 
                      radius="xl"
                    />
                  </Indicator>
                  
                  {/* Информация о друге */}
                  <div style={{ flex: 1 }}>
                    <Group justify="space-between">
                      <Text size="sm" fw={500} lineClamp={1}>
                        {friend.nickname}
                      </Text>
                      <Badge size="xs" variant="light">
                        LVL {friend.level}
                      </Badge>
                    </Group>
                  </div>
                </Group>

                {/* Действия с другом */}
                <Group gap={4} wrap="nowrap">
                    <Tooltip label="Пригласить в игру">
                      <ActionIcon 
                        variant="light" 
                        color="green"
                        size="md"
                      >
                        <IconPlayerPlay size={18} />
                      </ActionIcon>
                    </Tooltip>
                  
                  <Menu position="bottom-end">
                    <Menu.Target>
                      <ActionIcon variant="subtle" size="md">
                        <IconDotsVertical size={18} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item leftSection={<IconMessage size={14} />}>
                        Написать сообщение
                      </Menu.Item>
                      <Menu.Item leftSection={<IconUserPlus size={14} />}>
                        В избранное
                      </Menu.Item>
                      <Menu.Divider />
                      <Menu.Item 
                        color="red" 
                        leftSection={<IconUserMinus size={14} />}
                      >
                        Удалить из друзей
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Group>
              </Group>
            </Paper>
          ))}

          {filteredFriends.length === 0 && (
            <Text c="dimmed" ta="center" py="xl">
              Друзья не найдены
            </Text>
          )}
        </Stack>
      </ScrollArea>

      {/* Кнопка добавления друзей */}
      <Button 
        fullWidth 
        variant="light"
        leftSection={<IconUserPlus size={20} />}
        mt="md"
      >
        Найти друзей
      </Button>
    </Paper>
  );
};

export default FriendsList;