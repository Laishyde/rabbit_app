# Game state for Algodão the rabbit
rabbit_state = {
    "position": {"x": 5, "y": 5},  # Starting position in grid
    "age": 0,  # Age in game turns
    "energy": 100,  # Energy level (0-100)
    "carrots": 0,  # Carrots collected
    "grid_size": 10  # 10x10 grid
}

def validate_move(direction: str, current_position: dict) -> dict:
    """Validate if the move is within grid boundaries"""
    x = current_position.get("x", 5)
    y = current_position.get("y", 5)
    grid_size = rabbit_state["grid_size"]
    
    new_x, new_y = x, y
    
    if direction in ["cima", "up"]:
        new_y = max(0, y - 1)
    elif direction in ["baixo", "down"]:
        new_y = min(grid_size - 1, y + 1)
    elif direction in ["esquerda", "left"]:
        new_x = max(0, x - 1)
    elif direction in ["direita", "right"]:
        new_x = min(grid_size - 1, x + 1)
    elif direction == "pular":
        # Jump moves 2 spaces in a random direction
        import random
        jump_direction = random.choice(["up", "down", "left", "right"])
        if jump_direction == "up":
            new_y = max(0, y - 2)
        elif jump_direction == "down":
            new_y = min(grid_size - 1, y + 2)
        elif jump_direction == "left":
            new_x = max(0, x - 2)
        elif jump_direction == "right":
            new_x = min(grid_size - 1, x + 2)
    elif direction == "comer":
        # Eating doesn't change position
        return {
            "valid": True,
            "new_position": {"x": x, "y": y},
            "action": "eat",
            "message": "Algodão está comendo uma cenoura deliciosa!"
        }
    else:
        return {
            "valid": False,
            "message": f"Comando '{direction}' não reconhecido"
        }
    
    # Update rabbit state
    rabbit_state["position"] = {"x": new_x, "y": new_y}
    rabbit_state["age"] += 1
    rabbit_state["energy"] = max(0, rabbit_state["energy"] - 5)
    
    return {
        "valid": True,
        "new_position": {"x": new_x, "y": new_y},
        "old_position": {"x": x, "y": y},
        "action": direction,
        "message": f"Algodão se moveu para ({new_x}, {new_y})"
    }

def get_rabbit_state() -> dict:
    """Get current rabbit state"""
    return rabbit_state.copy()

def reset_rabbit_state():
    """Reset rabbit to initial state"""
    global rabbit_state
    rabbit_state = {
        "position": {"x": 5, "y": 5},
        "age": 0,
        "energy": 100,
        "carrots": 0,
        "grid_size": 10
    }
