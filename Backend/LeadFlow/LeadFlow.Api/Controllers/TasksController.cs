//Expone endpoints para gestionar tareas comerciales.

using LeadFlow.Application.DTOs.Tasks;
using LeadFlow.Application.Interfaces.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LeadFlow.Api.Controllers
{
    [ApiController]
    [Route("api/tasks")]
    [Authorize]
    public class TasksController : ControllerBase
    {
        private readonly ITaskService _taskService;

        public TasksController(ITaskService taskService)
        {
            _taskService = taskService;
        }

        // Obtiene todas las tareas activas de la empresa autenticada.
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] LeadFlow.Application.DTOs.Common.PagedRequest request)
        {
            var tasks = await _taskService.GetAllAsync(request);
            return Ok(tasks);
        }

        // Obtiene tareas vencidas y no completadas de la empresa autenticada.
        [HttpGet("overdue")]
        public async Task<IActionResult> GetOverdue()
        {
            var tasks = await _taskService.GetOverdueAsync();
            return Ok(tasks);
        }

        // Obtiene una tarea especifica si pertenece a la empresa autenticada.
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var task = await _taskService.GetByIdAsync(id);

            if (task is null)
            {
                return NotFound(new
                {
                    message = "Tarea no encontrada."
                });
            }

            return Ok(task);
        }

        // Crea una nueva tarea comercial asociada a cliente o lead.
        [HttpPost]
        public async Task<IActionResult> Create(CreateTaskRequest request)
        {
            try
            {
                var task = await _taskService.CreateAsync(request);

                return CreatedAtAction(
                    nameof(GetById),
                    new { id = task.Id },
                    task
                );
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }

        // Actualiza los datos principales de una tarea.
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, UpdateTaskRequest request)
        {
            try
            {
                var task = await _taskService.UpdateAsync(id, request);

                if (task is null)
                {
                    return NotFound(new
                    {
                        message = "Tarea no encontrada."
                    });
                }

                return Ok(task);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }

        // Cambia solo el estado de una tarea, por ejemplo a Completada.
        [HttpPatch("{id:int}/status")]
        public async Task<IActionResult> UpdateStatus(int id, UpdateTaskStatusRequest request)
        {
            var task = await _taskService.UpdateStatusAsync(id, request);

            if (task is null)
            {
                return NotFound(new
                {
                    message = "Tarea no encontrada."
                });
            }

            return Ok(task);
        }

        // Desactiva una tarea sin eliminarla fisicamente.
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Deactivate(int id)
        {
            var wasDeactivated = await _taskService.DeactivateAsync(id);

            if (!wasDeactivated)
            {
                return NotFound(new
                {
                    message = "Tarea no encontrada."
                });
            }

            return NoContent();
        }
    }
}
