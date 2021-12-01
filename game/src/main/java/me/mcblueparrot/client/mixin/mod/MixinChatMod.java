package me.mcblueparrot.client.mixin.mod;

import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.Redirect;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfoReturnable;

import me.mcblueparrot.client.mod.impl.hud.ChatMod;
import net.minecraft.client.gui.GuiChat;
import net.minecraft.client.gui.GuiScreen;
import net.minecraft.client.gui.GuiUtilRenderComponents;
import net.minecraft.client.settings.GameSettings;

public class MixinChatMod {

	@Mixin(GuiScreen.class)
	public static class MixinGuiScreen {

		@Redirect(method = "handleComponentClick",
				at = @At(value = "FIELD", target = "Lnet/minecraft/client/settings/GameSettings;chatLinks:Z"))
		public boolean overrideChatLinks(GameSettings settings) {
			if(ChatMod.enabled) {
				return ChatMod.instance.links;
			}

			return settings.chatLinks;
		}

		@Redirect(method = "handleComponentClick",
				at = @At(value = "FIELD", target = "Lnet/minecraft/client/settings/GameSettings;chatLinksPrompt:Z"))
		public boolean overrideChatLinksPrompt(GameSettings settings) {
			if(ChatMod.enabled) {
				return ChatMod.instance.promptLinks;
			}

			return settings.chatLinks;
		}

	}

	@Mixin(GameSettings.class)
	public static class MixinGameSettings {

		@Redirect(method = "sendSettingsToServer",
				at = @At(value = "FIELD", target = "Lnet/minecraft/client/settings/GameSettings;chatColours:Z"))
		public boolean overrideChatColours(GameSettings settings) {
			if(ChatMod.enabled) {
				return ChatMod.instance.colours;
			}

			return settings.chatColours;
		}

	}

	@Mixin(GuiUtilRenderComponents.class)
	public static class MixinGuiUtilRenderComponents {

		@Inject(method = "func_178909_a", at = @At("HEAD"), cancellable = true)
		private static void overrideChatColours(String input, boolean defaultValue,
										   CallbackInfoReturnable<String> callback) {
			if(ChatMod.enabled) {
				callback.setReturnValue(input);
			}
		}

	}

	@Mixin(GuiChat.class)
	public static class MixinGuiChat {

		public boolean canBeForceClosed() {
			if(ChatMod.enabled) {
				return !ChatMod.instance.preventClose;
			}
			return true;
		}

	}

}