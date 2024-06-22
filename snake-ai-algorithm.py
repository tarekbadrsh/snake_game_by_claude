import heapq

class SnakeAI:
    def __init__(self, board_width, board_height):
        self.board_width = board_width
        self.board_height = board_height

    def find_path(self, snake, apple):
        start = snake[0]
        goal = apple

        heap = [(0, start)]
        came_from = {}
        g_score = {start: 0}
        f_score = {start: self.heuristic(start, goal)}

        while heap:
            current = heapq.heappop(heap)[1]

            if current == goal:
                return self.reconstruct_path(came_from, current)

            for neighbor in self.get_neighbors(current):
                if neighbor in snake[:-1]:  # Avoid collision with snake body
                    continue

                tentative_g_score = g_score[current] + 1

                if neighbor not in g_score or tentative_g_score < g_score[neighbor]:
                    came_from[neighbor] = current
                    g_score[neighbor] = tentative_g_score
                    f_score[neighbor] = g_score[neighbor] + self.heuristic(neighbor, goal)
                    heapq.heappush(heap, (f_score[neighbor], neighbor))

        return None  # No path found

    def heuristic(self, a, b):
        return abs(a[0] - b[0]) + abs(a[1] - b[1])

    def get_neighbors(self, pos):
        x, y = pos
        neighbors = [
            ((x + 1) % self.board_width, y),
            ((x - 1) % self.board_width, y),
            (x, (y + 1) % self.board_height),
            (x, (y - 1) % self.board_height)
        ]
        return neighbors

    def reconstruct_path(self, came_from, current):
        path = [current]
        while current in came_from:
            current = came_from[current]
            path.append(current)
        return path[::-1]

    def get_next_move(self, snake, apple):
        path = self.find_path(snake, apple)
        if path and len(path) > 1:
            next_pos = path[1]
            head = snake[0]
            if next_pos[0] > head[0] or (next_pos[0] == 0 and head[0] == self.board_width - 1):
                return 'RIGHT'
            elif next_pos[0] < head[0] or (next_pos[0] == self.board_width - 1 and head[0] == 0):
                return 'LEFT'
            elif next_pos[1] > head[1] or (next_pos[1] == 0 and head[1] == self.board_height - 1):
                return 'DOWN'
            elif next_pos[1] < head[1] or (next_pos[1] == self.board_height - 1 and head[1] == 0):
                return 'UP'
        
        # If no path is found, try to move in a safe direction
        for direction in ['UP', 'DOWN', 'LEFT', 'RIGHT']:
            next_pos = self.get_next_position(snake[0], direction)
            if next_pos not in snake[:-1]:
                return direction
        
        # If no safe move is found, move in any direction (game over is inevitable)
        return 'UP'

    def get_next_position(self, head, direction):
        x, y = head
        if direction == 'UP':
            return (x, (y - 1) % self.board_height)
        elif direction == 'DOWN':
            return (x, (y + 1) % self.board_height)
        elif direction == 'LEFT':
            return ((x - 1) % self.board_width, y)
        elif direction == 'RIGHT':
            return ((x + 1) % self.board_width, y)

# Example usage
ai = SnakeAI(board_width=20, board_height=15)
snake = [(10, 10), (10, 11), (10, 12)]  # Head is at (10, 10)
apple = (5, 5)
next_move = ai.get_next_move(snake, apple)
print(f"Next move: {next_move}")
