using LeadFlow.Application.DTOs.Users;
using LeadFlow.Application.Interfaces.Users;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LeadFlow.Api.Controllers
{
    [ApiController]
    [Route("api/users")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;

        public UsersController(IUserService userService)
        {
            _userService = userService;
        }

        // Lista usuarios de la empresa autenticada para administracion interna.
        [HttpGet]
        [Authorize(Roles = "AdminEmpresa,Gerente")]
        public async Task<IActionResult> GetAll([FromQuery] LeadFlow.Application.DTOs.Common.PagedRequest request)
        {
            var users = await _userService.GetAllAsync(request);
            return Ok(users);
        }

        // Obtiene un usuario especifico si pertenece a la empresa autenticada.
        [HttpGet("{id:int}")]
        [Authorize(Roles = "AdminEmpresa,Gerente")]
        public async Task<IActionResult> GetById(int id)
        {
            var user = await _userService.GetByIdAsync(id);

            if (user is null)
            {
                return NotFound(new
                {
                    message = "Usuario no encontrado."
                });
            }

            return Ok(user);
        }

        // Crea usuarios operativos de empresa como vendedores, soporte o gerentes.
        [HttpPost]
        [Authorize(Roles = "AdminEmpresa")]
        public async Task<IActionResult> Create(CreateUserRequest request)
        {
            var user = await _userService.CreateAsync(request);

            return CreatedAtAction(
                nameof(GetById),
                new { id = user.Id },
                user
            );
        }

        // Actualiza datos administrativos de un usuario de la empresa.
        [HttpPut("{id:int}")]
        [Authorize(Roles = "AdminEmpresa")]
        public async Task<IActionResult> Update(int id, UpdateUserRequest request)
        {
            var user = await _userService.UpdateAsync(id, request);

            if (user is null)
            {
                return NotFound(new
                {
                    message = "Usuario no encontrado."
                });
            }

            return Ok(user);
        }

        // Activa o desactiva un usuario sin eliminarlo fisicamente.
        [HttpPatch("{id:int}/status")]
        [Authorize(Roles = "AdminEmpresa")]
        public async Task<IActionResult> UpdateStatus(int id, UpdateUserStatusRequest request)
        {
            var user = await _userService.UpdateStatusAsync(id, request);

            if (user is null)
            {
                return NotFound(new
                {
                    message = "Usuario no encontrado."
                });
            }

            return Ok(user);
        }
    }
}
